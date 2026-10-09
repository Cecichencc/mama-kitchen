-- Kitchen Garden / Shared Family Pantry — SECURITY REVIEW REQUIRED BEFORE APPLYING.
-- Supabase Postgres. This migration is committed to GitHub only, NOT applied.
-- Authenticated household membership is required to read stock or invoke mutation RPCs.
-- All stock writes go through transaction-scoped RPCs; never expose service_role to browser.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.kg_households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  timezone text not null default 'Asia/Singapore',
  created_at timestamptz not null default now()
);
create table if not exists public.kg_members (
  household_id uuid not null references public.kg_households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (household_id,user_id)
);
create index if not exists kg_members_by_user on public.kg_members(user_id);

create table if not exists public.kg_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.kg_households(id) on delete cascade,
  code_digest text not null unique,
  issued_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists kg_invites_by_household on public.kg_invites(household_id);

-- Ingredient/quantity data is intentionally minimal: no clinical profiles or meal history.
create table if not exists public.kg_batches (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.kg_households(id) on delete cascade,
  ingredient_id text not null,
  on_hand integer not null check (on_hand between 0 and 99999),
  unit text not null check (unit in ('piece','g','ml','bunch','pack')),
  organic_status text not null check (organic_status in ('organic','nonorganic','unknown')),
  storage text not null check (storage in ('fridge','freezer','pantry')),
  use_by date,
  version integer not null default 1 check (version>0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kg_batches_by_household on public.kg_batches(household_id);

-- Append-only audit and idempotency. One request UUID per mutation per household.
create table if not exists public.kg_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.kg_households(id) on delete cascade,
  batch_id uuid not null references public.kg_batches(id) on delete cascade,
  request_id uuid not null,
  request_payload jsonb not null,
  actor_id uuid not null references auth.users(id),
  event_type text not null check (event_type in ('add','correct','used-outside','discarded')),
  delta integer not null,
  old_quantity integer not null,
  new_quantity integer not null,
  created_at timestamptz not null default now(),
  unique(household_id,request_id)
);
create index if not exists kg_events_by_household on public.kg_events(household_id,created_at desc);

alter table public.kg_households enable row level security;
alter table public.kg_members enable row level security;
alter table public.kg_invites enable row level security;
alter table public.kg_batches enable row level security;
alter table public.kg_events enable row level security;

-- Security-definer helper prevents RLS policy recursion on membership.
create or replace function public.kg_is_member(p_household uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$
 select auth.uid() is not null and exists (
   select 1 from public.kg_members m
   where m.household_id=p_household and m.user_id=auth.uid()
 );
$$;

drop policy if exists kg_select_households on public.kg_households;
create policy kg_select_households on public.kg_households
 for select to authenticated using (public.kg_is_member(id));
drop policy if exists kg_select_members on public.kg_members;
create policy kg_select_members on public.kg_members
 for select to authenticated using (public.kg_is_member(household_id));
drop policy if exists kg_select_batches on public.kg_batches;
create policy kg_select_batches on public.kg_batches
 for select to authenticated using (public.kg_is_member(household_id));
drop policy if exists kg_select_events on public.kg_events;
create policy kg_select_events on public.kg_events
 for select to authenticated using (public.kg_is_member(household_id));

-- No direct browser writes are permitted on any shared table.
revoke all on public.kg_households,public.kg_members,public.kg_invites,
 public.kg_batches,public.kg_events from public,anon,authenticated;
grant select on public.kg_households,public.kg_members,public.kg_batches,
 public.kg_events to authenticated;

-- Mirror the 15 currently supported Pantry ingredients. Fail closed on unknown IDs.
create or replace function public.kg_unit_for(p_ingredient text)
returns text language sql immutable
set search_path = public, pg_temp
as $$
 select case
  when p_ingredient in ('tomato','egg','carrot','potato','onion','garlic',
   'mushroom','pumpkin','apple','orange') then 'piece'
  when p_ingredient in ('rice','chicken','fish') then 'g'
  when p_ingredient='bokchoy' then 'bunch'
  when p_ingredient='oil' then 'ml'
  else null
 end;
$$;

create or replace function public.kg_create_household(p_name text)
returns uuid language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if p_name is null or char_length(trim(p_name)) not between 1 and 80
 then raise exception 'INVALID_NAME' using errcode='22023'; end if;
 insert into public.kg_households(name) values (trim(p_name)) returning id into v_id;
 insert into public.kg_members(household_id,user_id,role)
 values(v_id,auth.uid(),'owner');
 return v_id;
end;
$$;

-- Only the household owner can create a single-use, 48-hour random invitation.
-- The plaintext code is returned ONCE; only a SHA-256 digest is stored.
create or replace function public.kg_create_invite(p_household uuid)
returns text language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_code text;
begin
 if auth.uid() is null or not exists (
  select 1 from public.kg_members
  where household_id=p_household and user_id=auth.uid() and role='owner'
 ) then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 perform 1 from public.kg_households where id=p_household for update;
 if (select count(*) from public.kg_members where household_id=p_household)>=2
 then raise exception 'HOUSEHOLD_FULL' using errcode='22023'; end if;
 v_code=encode(gen_random_bytes(24),'hex');
 insert into public.kg_invites(household_id,code_digest,issued_by,expires_at)
 values(p_household,encode(digest(v_code,'sha256'),'hex'),auth.uid(),now()+interval '48 hours');
 return v_code;
end;
$$;

create or replace function public.kg_join_invite(p_code text)
returns uuid language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare v_invite public.kg_invites%rowtype; v_household uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if p_code is null or p_code !~ '^[0-9a-f]{48}$'
 then raise exception 'INVALID_INVITE' using errcode='22023'; end if;
 select * into v_invite from public.kg_invites
 where code_digest=encode(digest(p_code,'sha256'),'hex')
   and used_at is null and expires_at>now();
 if not found then raise exception 'INVALID_INVITE' using errcode='22023'; end if;
 -- Lock household, not invite, to serialize membership and multiple invitations.
 select id into v_household from public.kg_households
 where id=v_invite.household_id for update;
 select * into v_invite from public.kg_invites
 where id=v_invite.id and used_at is null and expires_at>now() for update;
 if not found then raise exception 'INVALID_INVITE' using errcode='22023'; end if;
 if exists(select 1 from public.kg_members
           where household_id=v_household and user_id=auth.uid())
 then raise exception 'ALREADY_MEMBER' using errcode='22023'; end if;
 if (select count(*) from public.kg_members where household_id=v_household)>=2
 then raise exception 'HOUSEHOLD_FULL' using errcode='22023'; end if;
 insert into public.kg_members(household_id,user_id,role)
 values(v_household,auth.uid(),'member');
 update public.kg_invites set used_at=now(),used_by=auth.uid()
 where id=v_invite.id;
 return v_household;
end;
$$;

create or replace function public.kg_add_batch(
 p_household uuid,p_ingredient text,p_quantity integer,p_unit text,
 p_organic text,p_storage text,p_use_by date,p_request_id uuid
) returns public.kg_batches language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_row public.kg_batches%rowtype;
 v_payload jsonb; v_prior jsonb; v_batch uuid;
begin
 if auth.uid() is null or not public.kg_is_member(p_household)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 if p_request_id is null or p_quantity is null or p_quantity not between 1 and 99999
   or p_unit is distinct from public.kg_unit_for(p_ingredient)
   or p_unit is null or p_organic not in ('organic','nonorganic','unknown')
   or p_storage not in ('fridge','freezer','pantry')
   or p_organic is null or p_storage is null
 then raise exception 'INVALID_BATCH' using errcode='22023'; end if;
 -- One household-wide row lock serializes concurrent write+retry requests.
 perform 1 from public.kg_households where id=p_household for update;
 v_payload=jsonb_build_object('action','add','ingredient',p_ingredient,
  'quantity',p_quantity,'unit',p_unit,'organic',p_organic,'storage',p_storage,
  'useBy',p_use_by);
 select request_payload,batch_id into v_prior,v_batch from public.kg_events
 where household_id=p_household and request_id=p_request_id;
 if found then
  if v_prior<>v_payload then raise exception 'IDEMPOTENCY_KEY_REUSED' using errcode='22023'; end if;
  select * into v_row from public.kg_batches where id=v_batch;
  return v_row;
 end if;
 insert into public.kg_batches(
  household_id,ingredient_id,on_hand,unit,organic_status,storage,use_by,created_by
 ) values(p_household,p_ingredient,p_quantity,p_unit,p_organic,p_storage,p_use_by,auth.uid())
 returning * into v_row;
 insert into public.kg_events(
  household_id,batch_id,request_id,request_payload,actor_id,event_type,
  delta,old_quantity,new_quantity
 ) values(p_household,v_row.id,p_request_id,v_payload,auth.uid(),'add',
  p_quantity,0,p_quantity);
 return v_row;
end;
$$;

create or replace function public.kg_correct_batch(
 p_household uuid,p_batch uuid,p_expected_version integer,
 p_on_hand integer,p_reason text,p_request_id uuid
) returns public.kg_batches language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_row public.kg_batches%rowtype; v_payload jsonb; v_prior jsonb; v_batch uuid;
 v_old integer;
begin
 if auth.uid() is null or not public.kg_is_member(p_household)
 then raise exception 'NOT_AUTHORIZED' using errcode='42501'; end if;
 if p_request_id is null or p_expected_version is null or p_expected_version<1
  or p_on_hand is null or p_on_hand not between 0 and 99999
  or p_reason not in ('count','used-outside','discarded') or p_reason is null
 then raise exception 'INVALID_CORRECTION' using errcode='22023'; end if;
 perform 1 from public.kg_households where id=p_household for update;
 v_payload=jsonb_build_object('action','correct','batch',p_batch,
  'expectedVersion',p_expected_version,'onHand',p_on_hand,'reason',p_reason);
 select request_payload,batch_id into v_prior,v_batch from public.kg_events
 where household_id=p_household and request_id=p_request_id;
 if found then
  if v_prior<>v_payload then raise exception 'IDEMPOTENCY_KEY_REUSED' using errcode='22023'; end if;
  select * into v_row from public.kg_batches where id=v_batch;
  return v_row;
 end if;
 select * into v_row from public.kg_batches
 where id=p_batch and household_id=p_household for update;
 if not found then raise exception 'BATCH_NOT_FOUND' using errcode='22023'; end if;
 if v_row.version<>p_expected_version then
  raise exception 'STALE_VERSION' using errcode='40001';
 end if;
 if p_reason in ('used-outside','discarded') and p_on_hand>v_row.on_hand then
  raise exception 'INVALID_CORRECTION' using errcode='22023';
 end if;
 v_old=v_row.on_hand;
 update public.kg_batches set on_hand=p_on_hand,version=version+1,updated_at=now()
 where id=p_batch returning * into v_row;
 insert into public.kg_events(
  household_id,batch_id,request_id,request_payload,actor_id,event_type,
  delta,old_quantity,new_quantity
 ) values(p_household,p_batch,p_request_id,v_payload,auth.uid(),
  case when p_reason='count' then 'correct' else p_reason end,
  p_on_hand-v_old,v_old,p_on_hand);
 return v_row;
end;
$$;

-- Explicitly lock down functions: no execute access to anonymous/public roles.
revoke all on function public.kg_is_member(uuid) from public,anon;
revoke all on function public.kg_unit_for(text) from public,anon;
revoke all on function public.kg_create_household(text) from public,anon;
revoke all on function public.kg_create_invite(uuid) from public,anon;
revoke all on function public.kg_join_invite(text) from public,anon;
revoke all on function public.kg_add_batch(uuid,text,integer,text,text,text,date,uuid) from public,anon;
revoke all on function public.kg_correct_batch(uuid,uuid,integer,integer,text,uuid) from public,anon;
grant execute on function public.kg_is_member(uuid) to authenticated;
grant execute on function public.kg_unit_for(text) to authenticated;
grant execute on function public.kg_create_household(text) to authenticated;
grant execute on function public.kg_create_invite(uuid) to authenticated;
grant execute on function public.kg_join_invite(text) to authenticated;
grant execute on function public.kg_add_batch(uuid,text,integer,text,text,text,date,uuid) to authenticated;
grant execute on function public.kg_correct_batch(uuid,uuid,integer,integer,text,uuid) to authenticated;
