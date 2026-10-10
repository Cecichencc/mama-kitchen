import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRemoteFamilyTestEnvironment} from '../integration/remote-test-guard.mjs';
import {readFileSync} from 'node:fs';

const now=Date.parse('2026-10-10T00:00:00Z');
const ref='abcdefghijklmnopqrst';
const origin='https://'+ref+'.supabase.co';
const ids=[
 '11111111-1111-4111-8111-111111111111',
 '22222222-2222-4222-8222-222222222222',
 '33333333-3333-4333-8333-333333333333'
];
function mockJwt(sub,{iss=origin+'/auth/v1',role='authenticated',exp=Math.floor(now/1000)+7200}={}){
 const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
 const payload=Buffer.from(JSON.stringify({sub,iss,role,exp})).toString('base64url');
 return header+'.'+payload+'.'+Buffer.from('mock-not-signed').toString('base64url');
}
const env=()=>({
 KG_ENABLE_REMOTE_E2E:'I_ACCEPT_ISOLATED_TEST_WRITES',
 KG_TEST_SUPABASE_URL:origin+'/',
 KG_TEST_PROJECT_CONFIRMATION:'isolated-test:'+ref,
 KG_TEST_PUBLISHABLE_KEY:'sb_publishable_1234567890123456',
 KG_TEST_OWNER_JWT:mockJwt(ids[0]),
 KG_TEST_MEMBER_JWT:mockJwt(ids[1]),
 KG_TEST_OUTSIDER_JWT:mockJwt(ids[2])
});
const rejects=(input,expected)=>assert.throws(
 ()=>validateRemoteFamilyTestEnvironment(input,now),
 error=>error.message===expected
);
test('Remote tests require explicit consent and isolated project confirmation',()=>{
 const a=env();
 assert.equal(validateRemoteFamilyTestEnvironment(a,now).ref,ref);
 rejects({...a,KG_ENABLE_REMOTE_E2E:'true'},'EXPLICIT_REMOTE_TEST_OPT_IN_REQUIRED');
 rejects({...a,KG_TEST_PROJECT_CONFIRMATION:'yes'},'EXPLICIT_ISOLATED_PROJECT_CONFIRMATION_REQUIRED');
 rejects({...a,KG_TEST_SUPABASE_URL:'https://prod.example.com/'},'ISOLATED_TEST_PROJECT_REQUIRED');
 rejects({...a,KG_TEST_SUPABASE_URL:'http://'+ref+'.supabase.co/'},'ISOLATED_TEST_PROJECT_REQUIRED');
 rejects({...a,KG_TEST_PUBLISHABLE_KEY:'service_role_key'},'PUBLIC_TEST_KEY_REQUIRED');
});
test('Three distinct, fresh and project-scoped authenticated test identities are mandatory',()=>{
 const a=env();
 rejects({...a,KG_TEST_MEMBER_JWT:a.KG_TEST_OWNER_JWT},'THREE_DISTINCT_TEST_ACCOUNTS_REQUIRED');
 rejects({...a,KG_TEST_OUTSIDER_JWT:mockJwt(ids[2],{role:'service_role'})},'UNSUITABLE_TEST_JWT');
 rejects({...a,KG_TEST_OUTSIDER_JWT:mockJwt(ids[2],{iss:'https://other.supabase.co/auth/v1'})},'UNSUITABLE_TEST_JWT');
 rejects({...a,KG_TEST_OUTSIDER_JWT:mockJwt(ids[2],{exp:Math.floor(now/1000)+90})},'UNSUITABLE_TEST_JWT');
 rejects({...a,KG_TEST_MEMBER_JWT:'INVALID'},'THREE_AUTHENTICATED_TEST_JWTS_REQUIRED');
});
test('test harness cannot accidentally run on normal npm test or CI, and never prints tokens',()=>{
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(pkg.scripts.build,'vite build');
 const remote=readFileSync(new URL('../integration/shared-family-remote.test.mjs',import.meta.url),'utf8');
 const preflight=readFileSync(new URL('../integration/remote-test-guard.mjs',import.meta.url),'utf8');
 assert.match(remote,/validateRemoteFamilyTestEnvironment\(process\.env\)/);
 assert.match(remote,/createSharedPantryGateway/);
 assert.match(remote,/isolated three-user shared Pantry/);
 assert.doesNotMatch(remote,/\bconsole\.(log|warn|error|info)\s*\(/);
 assert.doesNotMatch(preflight,/\bconsole\.(log|warn|error|info)\s*\(/);
 assert.doesNotMatch(remote,/\bservice_role\b/);
});
test('integration tests explicitly cover RLS, single-use invitations and stale concurrent edits',()=>{
 const remote=readFileSync(new URL('../integration/shared-family-remote.test.mjs',import.meta.url),'utf8');
 for(const invariant of ['createHousehold','createInvite','joinInvite','readEvents',
  'IDEMPOTENCY_KEY_REUSED','HOUSEHOLD_FULL','NOT_AUTHORIZED','STALE_VERSION',
  'Promise.allSettled']){
  assert.ok(remote.includes(invariant),invariant);
 }
});
