-- Kitchen Garden: supporting indexes for isolated Shared Pantry test schema.
-- Apply after 20261010000000_shared_household_pantry.sql.
-- No data moves or writes to existing household records.
-- The unused-index advisory on empty tables is expected; don't remove by guess.

create index if not exists kg_batches_by_created_by
 on public.kg_batches(created_by);
create index if not exists kg_events_by_actor
 on public.kg_events(actor_id);
create index if not exists kg_events_by_batch
 on public.kg_events(batch_id);
create index if not exists kg_invites_by_issuer
 on public.kg_invites(issued_by);
create index if not exists kg_invites_by_redeemer
 on public.kg_invites(used_by)
 where used_by is not null;
