// Explicit opt-in gate for REAL remote tests that create test-only accounts'
// household records, invitation rows and inventory batches. Never CI-auto-run.
// Tokens are read from env at runtime, never printed, persisted or committed.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXPECTED_FLAG='I_ACCEPT_ISOLATED_TEST_WRITES';
const MIN_TOKEN_LIFE_SECONDS=300;
const fail=code=>{throw new Error(code);};

function readAccount(token,base,now){
 if(typeof token!=='string'||token.length>16384||token.split('.').length!==3)
  fail('THREE_AUTHENTICATED_TEST_JWTS_REQUIRED');
 let payload;
 try{payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));}
 catch{fail('MALFORMED_TEST_JWT');}
 if(!UUID.test(payload?.sub||'')||payload?.role!=='authenticated'
    ||payload?.iss!==base+'/auth/v1'
    ||!Number.isFinite(payload?.exp)||payload.exp<=Math.floor(now/1000)+MIN_TOKEN_LIFE_SECONDS)
  fail('UNSUITABLE_TEST_JWT');
 return payload.sub;
}
export function validateRemoteFamilyTestEnvironment(env,now=Date.now()){
 if(env?.KG_ENABLE_REMOTE_E2E!==EXPECTED_FLAG)
  fail('EXPLICIT_REMOTE_TEST_OPT_IN_REQUIRED');
 let project;
 try{project=new URL(env.KG_TEST_SUPABASE_URL);}
 catch{fail('ISOLATED_TEST_PROJECT_REQUIRED');}
 if(project.protocol!=='https:'||project.port||project.pathname!=='/'||
    project.search||project.hash||project.username||project.password)
  fail('ISOLATED_TEST_PROJECT_REQUIRED');
 const matched=project.hostname.match(/^([a-z0-9]{12,})\.supabase\.co$/);
 if(!matched)fail('ISOLATED_TEST_PROJECT_REQUIRED');
 const ref=matched[1];
 if(env.KG_TEST_PROJECT_CONFIRMATION!=='isolated-test:'+ref)
  fail('EXPLICIT_ISOLATED_PROJECT_CONFIRMATION_REQUIRED');
 if(typeof env.KG_TEST_PUBLISHABLE_KEY!=='string'||
    !env.KG_TEST_PUBLISHABLE_KEY.startsWith('sb_publishable_')||
    env.KG_TEST_PUBLISHABLE_KEY.length<20)
  fail('PUBLIC_TEST_KEY_REQUIRED');
 const base=project.origin;
 const owner=readAccount(env.KG_TEST_OWNER_JWT,base,now);
 const member=readAccount(env.KG_TEST_MEMBER_JWT,base,now);
 const outsider=readAccount(env.KG_TEST_OUTSIDER_JWT,base,now);
 if(new Set([owner,member,outsider]).size!==3)
  fail('THREE_DISTINCT_TEST_ACCOUNTS_REQUIRED');
 return Object.freeze({
  ref,url:base,publishableKey:env.KG_TEST_PUBLISHABLE_KEY,
  // These are test user access tokens. Never print this object.
  ownerJWT:env.KG_TEST_OWNER_JWT,
  memberJWT:env.KG_TEST_MEMBER_JWT,
  outsiderJWT:env.KG_TEST_OUTSIDER_JWT
 });
}
