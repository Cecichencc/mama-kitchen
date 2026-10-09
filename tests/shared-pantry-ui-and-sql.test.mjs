import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../public/phase0/',import.meta.url);
const html=readFileSync(new URL('index.html',root),'utf8');
const ui=readFileSync(new URL('game-ui.js',root),'utf8');
const css=readFileSync(new URL('styles.css',root),'utf8');
const i18n=readFileSync(new URL('i18n.js',root),'utf8');
const migration=readFileSync(new URL('../supabase/migrations/20261010000000_shared_household_pantry.sql',import.meta.url),'utf8');

test('Pantry shows local-only family-sharing status without an enabled online switch',()=>{
 assert.match(html,/id="kgFamilySyncPanel"/);
 assert.match(html,/data-i18n="family.localStatus"/);
 assert.match(html,/This device only · Not shared/);
 assert.match(html,/id="kgReviewLocalStock"/);
 assert.match(html,/id="kgFamilyPreview"[^>]*hidden/);
 assert.doesNotMatch(html,/data-family-connect|data-family-upload|data-family-sync-enabled/);
});
test('review button only reads the existing local state and never uploads it',()=>{
 assert.match(ui,/previewLocalInventoryTransfer\(state\)/);
 assert.match(ui,/byId\('kgReviewLocalStock'\)\.addEventListener\('click'/);
 assert.match(ui,/kgFamilyPreviewSummary/);
 assert.match(css,/\.kg-family-sync\{/);
 assert.match(css,/\.kg-family-explanation summary/);
});
test('family-sharing status and review messaging is bilingual and explains consent',()=>{
 for(const phrase of [
  'family.title','family.localStatus','family.description','family.review',
  'family.summary','family.noUpload','family.how','family.howBody'
 ]){
  assert.equal(i18n.split("'"+phrase+"'").length,3,phrase+' must have English and Chinese labels');
 }
 assert.match(i18n,/You must approve any future transfer/);
 assert.match(i18n,/尚未上传任何食材/);
});
test('migration enables RLS with members-only reads and no direct writes',()=>{
 for(const table of ['kg_households','kg_members','kg_invites','kg_batches','kg_events']){
  assert.ok(migration.includes('alter table public.'+table+' enable row level security;'),table);
 }
 assert.match(migration,/revoke all on public\.kg_households,public\.kg_members,public\.kg_invites/);
 assert.match(migration,/grant select on public\.kg_households,public\.kg_members,public\.kg_batches/);
 assert.match(migration,/public\.kg_is_member\(household_id\)/);
 assert.doesNotMatch(migration,/grant (?:insert|update|delete|all) on public\.kg_batches to authenticated/i);
});
test('migration stores invitation hash, not raw invite codes',()=>{
 assert.match(migration,/gen_random_bytes\(24\)/);
 assert.match(migration,/digest\(v_code,'sha256'\)/);
 assert.match(migration,/interval '48 hours'/);
 assert.match(migration,/used_at is null/);
 assert.match(migration,/HOUSEHOLD_FULL/);
});
test('writes are guarded by version checks, idempotency and atomic audit records',()=>{
 assert.match(migration,/unique\(household_id,request_id\)/);
 assert.match(migration,/p_request_id/);
 assert.match(migration,/for update/);
 assert.match(migration,/STALE_VERSION/);
 assert.match(migration,/IDEMPOTENCY_KEY_REUSED/);
 assert.match(migration,/v_old=v_row\.on_hand;/);
 assert.match(migration,/p_on_hand-v_old,v_old,p_on_hand/);
 assert.match(migration,/version=version\+1/);
});
