-- Kitchen Garden Shared Pantry: isolated, rollback-only SQL behavioral smoke test.
-- MANUAL ONLY. Run on a dedicated Supabase test database via SQL editor/connector.
-- This deliberately creates 3 transient auth.users fixtures and stock inside
-- BEGIN...ROLLBACK: on success, nothing is persisted.
-- Do NOT run on a production or customer-data project.
-- Each ASSERT failure raises an exception; do not interpret an error as a pass.

BEGIN;

SELECT
  set_config('kg.test_owner',gen_random_uuid()::text,true),
  set_config('kg.test_member',gen_random_uuid()::text,true),
  set_config('kg.test_outsider',gen_random_uuid()::text,true);

INSERT INTO auth.users
  (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
VALUES
  (current_setting('kg.test_owner')::uuid,'00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','kg-test-owner-rollback@example.invalid','',now(),now(),now()),
  (current_setting('kg.test_member')::uuid,'00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','kg-test-member-rollback@example.invalid','',now(),now(),now()),
  (current_setting('kg.test_outsider')::uuid,'00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','kg-test-outsider-rollback@example.invalid','',now(),now(),now());

-- Emulate the real authenticated database role, not a privileged postgres caller.
SET LOCAL ROLE authenticated;

DO $smoke$
DECLARE
  family_id uuid;
  invite1 text;
  invite2 text;
  batch public.kg_batches%rowtype;
  replay public.kg_batches%rowtype;
  changed public.kg_batches%rowtype;
  batch_id uuid;
  request_id uuid:=gen_random_uuid();
  failed boolean;
  event_count integer;
BEGIN
  PERFORM set_config('request.jwt.claim.sub',current_setting('kg.test_owner'),true);
  IF auth.uid() IS DISTINCT FROM current_setting('kg.test_owner')::uuid
  THEN RAISE EXCEPTION 'TEST_AUTH_CONTEXT_FAILED'; END IF;

  family_id:=public.kg_create_household('Disposable Kitchen Garden Test');
  IF NOT public.kg_is_member(family_id)
  THEN RAISE EXCEPTION 'TEST_OWNER_MEMBERSHIP_FAILED'; END IF;
  IF (SELECT count(*) FROM public.kg_members WHERE household_id=family_id)<>1
  THEN RAISE EXCEPTION 'TEST_OWNER_MEMBER_COUNT_FAILED'; END IF;
  invite1:=public.kg_create_invite(family_id);
  invite2:=public.kg_create_invite(family_id);
  IF length(invite1)<>48 OR invite1=invite2
  THEN RAISE EXCEPTION 'TEST_INVITE_FORMAT_FAILED'; END IF;

  SELECT * INTO batch FROM public.kg_add_batch(
    family_id,'tomato',6,'piece','organic','fridge',NULL,request_id
  );
  batch_id:=batch.id;
  IF batch.on_hand<>6 OR batch.version<>1 OR batch.organic_status<>'organic'
  THEN RAISE EXCEPTION 'TEST_INITIAL_STOCK_FAILED'; END IF;

  SELECT * INTO replay FROM public.kg_add_batch(
    family_id,'tomato',6,'piece','organic','fridge',NULL,request_id
  );
  IF replay.id<>batch_id OR
    (SELECT count(*) FROM public.kg_batches WHERE household_id=family_id)<>1
  THEN RAISE EXCEPTION 'TEST_IDEMPOTENCY_DUPLICATE_CREATED'; END IF;

  failed:=false;
  BEGIN
    PERFORM public.kg_add_batch(family_id,'tomato',7,'piece','organic','fridge',NULL,request_id);
  EXCEPTION WHEN SQLSTATE '22023' THEN failed:=true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'TEST_DIFFERENT_PAYLOAD_REPLAY_ACCEPTED'; END IF;

  PERFORM set_config('request.jwt.claim.sub',current_setting('kg.test_member'),true);
  IF public.kg_is_member(family_id)
  THEN RAISE EXCEPTION 'TEST_PRE_JOIN_MEMBERSHIP_LEAK'; END IF;
  IF (SELECT count(*) FROM public.kg_batches WHERE household_id=family_id)<>0
  THEN RAISE EXCEPTION 'TEST_PRE_JOIN_STOCK_LEAK'; END IF;

  failed:=false;
  BEGIN
    PERFORM public.kg_add_batch(
      family_id,'egg',1,'piece','unknown','fridge',NULL,gen_random_uuid()
    );
  EXCEPTION WHEN SQLSTATE '42501' THEN failed:=true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'TEST_UNINVITED_WRITE_SUCCEEDED'; END IF;

  IF public.kg_join_invite(invite1)<>family_id
  THEN RAISE EXCEPTION 'TEST_MEMBER_JOIN_FAILED'; END IF;
  IF NOT public.kg_is_member(family_id)
  THEN RAISE EXCEPTION 'TEST_MEMBER_VISIBILITY_FAILED'; END IF;
  IF (SELECT count(*) FROM public.kg_batches WHERE household_id=family_id)<>1
  THEN RAISE EXCEPTION 'TEST_MEMBER_STOCK_ACCESS_FAILED'; END IF;

  failed:=false;
  BEGIN
    PERFORM public.kg_join_invite(invite1);
  EXCEPTION WHEN SQLSTATE '22023' THEN failed:=true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'TEST_REUSED_INVITE_ACCEPTED'; END IF;

  PERFORM set_config('request.jwt.claim.sub',current_setting('kg.test_outsider'),true);
  IF public.kg_is_member(family_id) OR
    (SELECT count(*) FROM public.kg_events WHERE household_id=family_id)<>0
  THEN RAISE EXCEPTION 'TEST_OUTSIDER_EVENT_ACCESS'; END IF;

  failed:=false;
  BEGIN
    PERFORM public.kg_join_invite(invite2);
  EXCEPTION WHEN SQLSTATE '22023' THEN failed:=true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'TEST_THIRD_MEMBER_ACCEPTED'; END IF;

  failed:=false;
  BEGIN
    PERFORM public.kg_create_invite(family_id);
  EXCEPTION WHEN SQLSTATE '42501' THEN failed:=true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'TEST_OUTSIDER_INVITE_ALLOWED'; END IF;

  PERFORM set_config('request.jwt.claim.sub',current_setting('kg.test_owner'),true);
  SELECT * INTO changed FROM public.kg_correct_batch(
    family_id,batch_id,1,4,'count',gen_random_uuid()
  );
  IF changed.version<>2 OR changed.on_hand<>4
  THEN RAISE EXCEPTION 'TEST_CORRECTION_1_FAILED'; END IF;

  PERFORM set_config('request.jwt.claim.sub',current_setting('kg.test_member'),true);
  failed:=false;
  BEGIN
    PERFORM public.kg_correct_batch(
      family_id,batch_id,1,5,'count',gen_random_uuid()
    );
  EXCEPTION WHEN SQLSTATE '40001' THEN failed:=true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'TEST_STALE_WRITE_SUCCEEDED'; END IF;

  SELECT * INTO changed FROM public.kg_correct_batch(
    family_id,batch_id,2,2,'count',gen_random_uuid()
  );
  IF changed.version<>3 OR changed.on_hand<>2
  THEN RAISE EXCEPTION 'TEST_CORRECTION_2_FAILED'; END IF;

  SELECT count(*) INTO event_count FROM public.kg_events WHERE household_id=family_id;
  IF event_count<>3 THEN RAISE EXCEPTION 'TEST_BAD_EVENT_COUNT: %',event_count; END IF;
  IF (SELECT sum(delta) FROM public.kg_events WHERE household_id=family_id)<>2
  THEN RAISE EXCEPTION 'TEST_BAD_TOTAL_DELTA'; END IF;
  IF (SELECT count(*) FROM public.kg_events
      WHERE household_id=family_id AND event_type='correct'
      AND old_quantity=6 AND new_quantity=4 AND delta=-2)<>1
  THEN RAISE EXCEPTION 'TEST_BAD_FIRST_DELTA'; END IF;
  IF (SELECT count(*) FROM public.kg_events
      WHERE household_id=family_id AND event_type='correct'
      AND old_quantity=4 AND new_quantity=2 AND delta=-2)<>1
  THEN RAISE EXCEPTION 'TEST_BAD_SECOND_DELTA'; END IF;

  RAISE NOTICE 'PASS: rollback-only Kitchen Garden three-member database smoke test';
END;
$smoke$;

-- IMPORTANT: all temporary test accounts, stock, invites and movements disappear.
ROLLBACK;
