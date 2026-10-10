import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=relative=>readFileSync(new URL(relative,import.meta.url),'utf8');
const smoke=read('../supabase/tests/rollback_only_family_security_smoke.sql');
const migration=read('../supabase/migrations/20261010000000_shared_household_pantry.sql');

test('Manual SQL smoke test explicitly rolls back every disposable identity and food record',()=>{
 assert.match(smoke,/^\s*BEGIN\s*;/im);
 assert.match(smoke,/ROLLBACK\s*;\s*$/i);
 assert.match(smoke,/INSERT INTO auth\.users/);
 assert.match(smoke,/@example\.invalid/);
 assert.match(smoke,/SET LOCAL ROLE authenticated;/);
 assert.match(smoke,/auth\.uid\(\)/);
 assert.doesNotMatch(smoke,/\bCOMMIT\s*;/i);
 assert.doesNotMatch(smoke,/\bTRUNCATE\s+|DROP\s+TABLE|DELETE\s+FROM\b/i);
});
test('DB smoke exercises household privacy, invitations and stock idempotency',()=>{
 for(const invariant of [
  'kg_create_household','kg_create_invite','kg_join_invite','kg_add_batch',
  'kg_correct_batch','kg_is_member','kg_events',
  'TEST_OUTSIDER_EVENT_ACCESS','TEST_THIRD_MEMBER_ACCEPTED',
  'TEST_REUSED_INVITE_ACCEPTED','TEST_STALE_WRITE_SUCCEEDED',
  'TEST_IDEMPOTENCY_DUPLICATE_CREATED','TEST_BAD_TOTAL_DELTA'
 ]){
  assert.ok(smoke.includes(invariant),invariant);
 }
});
test('Shared Pantry migration ensures table-only, membership-scoped RLS reads',()=>{
 for(const table of ['kg_households','kg_members','kg_invites','kg_batches','kg_events']){
  assert.ok(migration.includes('alter table public.'+table+' enable row level security;'),table);
 }
 assert.match(migration,/revoke all on public\.kg_households,public\.kg_members,public\.kg_invites/);
 assert.match(migration,/p_expected_version/);
 assert.match(migration,/IDEMPOTENCY_KEY_REUSED/);
 assert.match(migration,/v_old=v_row\.on_hand/);
});
test('No live test project identifiers, JWTs or integration flags are embedded in runtime app',()=>{
 const conf=read('../public/phase0/family-config.js');
 assert.match(conf,/enabled:false/);
 assert.doesNotMatch(conf,/voytokitbphutqgrvutm/);
 // Ignore comments like "NEVER use sb_secret_"; inspect executable source instead.
 const runtime=conf.replace(/\/\/[^\n]*/g,'');
 assert.doesNotMatch(runtime,/eyJhbGci|sb_secret_[A-Za-z0-9]{8}|service_role\s*:/);
});
