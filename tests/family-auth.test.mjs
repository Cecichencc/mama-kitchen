import test from 'node:test';
import assert from 'node:assert/strict';
import {FAMILY_BACKEND_CONFIG,readFamilyBackendConfig} from '../public/phase0/family-config.js';
import {createFamilyEmailAuth,FamilyAuthError} from '../public/phase0/family-auth.js';
import {createSharedPantryGateway} from '../public/phase0/shared-pantry-gateway.js';

const publicConfig=Object.freeze({
 enabled:true,url:'https://kitchen-test.supabase.co',publishableKey:'sb_publishable_1234567890testkey'
});
const valid=()=>readFamilyBackendConfig(publicConfig);
const ok=data=>({ok:true,status:200,json:async()=>data});
const bad=(status,detail)=>({ok:false,status,json:async()=>({message:detail})});
const access='token-access-1234567890123456789';
const refresh='token-refresh-1234567890123456789';
const second='token-access-refreshed-123456789012345';
const user={id:'11111111-1111-4111-8111-111111111111',email:'mom@example.com'};
const verified=()=>({access_token:access,refresh_token:refresh,expires_in:3600,user});
const refreshed=()=>({access_token:second,refresh_token:'refresh-rotated-123456789012345',expires_in:3600,user});

test('Family config stays disabled unless explicitly approved',()=>{
 assert.equal(FAMILY_BACKEND_CONFIG.enabled,false);
 assert.equal(readFamilyBackendConfig(),null);
 assert.equal(readFamilyBackendConfig({...publicConfig,enabled:false}),null);
 assert.equal(readFamilyBackendConfig({...publicConfig,url:'http://kitchen-test.supabase.co'}),null);
 assert.equal(readFamilyBackendConfig({...publicConfig,url:'https://name:pass@kitchen-test.supabase.co/'}),null);
 assert.equal(readFamilyBackendConfig({...publicConfig,url:'https://kitchen-test.supabase.co/evil'}),null);
 assert.equal(readFamilyBackendConfig({...publicConfig,publishableKey:'sb_secret_test_secret'}),null);
 assert.equal(readFamilyBackendConfig({...publicConfig,publishableKey:'service_role'}),null);
 assert.equal(valid().url,'https://kitchen-test.supabase.co');
});

test('Unconfigured auth throws before contacting network',()=>{
 let calls=0;
 assert.throws(()=>createFamilyEmailAuth({
  config:FAMILY_BACKEND_CONFIG,fetcher:async()=>{calls++;}
 }),/BACKEND_NOT_CONFIGURED/);
 assert.equal(calls,0);
});

test('OTP request, verification and authenticated household gateway use the signed-in user',async()=>{
 let timestamp=Date.parse('2026-10-10T02:00:00Z');
 const calls=[];const changes=[];
 const fetcher=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/otp'))return ok({});
  if(url.endsWith('/verify'))return ok(verified());
  if(url.includes('/kg_households?'))return ok([]);
  return bad(400,'unsupported');
 };
 const auth=createFamilyEmailAuth({
  config:publicConfig,fetcher,now:()=>timestamp,onChange:state=>changes.push(state)
 });
 assert.equal(auth.getSession(),null);
 const sent=await auth.requestCode(' Mom@Example.com ');
 assert.equal(sent.email,'mom@example.com');
 assert.equal(auth.getPendingEmail(),'mom@example.com');
 assert.equal(calls[0].url,'https://kitchen-test.supabase.co/auth/v1/otp');
 assert.equal(calls[0].options.headers.apikey,publicConfig.publishableKey);
 assert.equal(calls[0].options.headers.Authorization,undefined);
 assert.deepEqual(JSON.parse(calls[0].options.body),{email:'mom@example.com',create_user:true});
 await assert.rejects(()=>auth.verifyCode('12345'),e=>e.code==='INVALID_OTP');
 assert.equal(calls.length,1);
 await auth.verifyCode('123456');
 assert.deepEqual(JSON.parse(calls[1].options.body),{email:'mom@example.com',token:'123456',type:'email'});
 assert.equal(auth.getSession().email,'mom@example.com');
 assert.equal(auth.getPendingEmail(),null);
 assert.equal(auth.getSession().accessToken,undefined);
 assert.equal(changes.length,1);
 const api=createSharedPantryGateway({
  url:valid().url,anonKey:publicConfig.publishableKey,
  getAccessToken:()=>auth.getAccessToken(),fetcher
 });
 assert.deepEqual(await api.listHouseholds(),[]);
 assert.equal(calls[2].options.headers.Authorization,'Bearer '+access);
 assert.equal(auth.getSession().userId,user.id);
});

test('bad email, requests repeated within one minute and invalid codes never call verify',async()=>{
 let timestamp=Date.parse('2026-10-10T02:00:00Z');
 const calls=[];const auth=createFamilyEmailAuth({
  config:publicConfig,now:()=>timestamp,
  fetcher:async(url,options)=>{calls.push(url);return ok({});}
 });
 await assert.rejects(()=>auth.requestCode('invalid'),e=>e.code==='INVALID_EMAIL');
 assert.equal(calls.length,0);
 await auth.requestCode('daughter@example.com');
 await assert.rejects(()=>auth.requestCode('daughter@example.com'),e=>e.code==='WAIT_BEFORE_RESEND');
 assert.equal(calls.length,1);
 timestamp+=60000;
 await auth.requestCode('daughter@example.com');
 assert.equal(calls.length,2);
 await assert.rejects(()=>auth.verifyCode('oops'),e=>e.code==='INVALID_OTP');
 assert.equal(calls.length,2);
});

test('refresh expired access tokens once for concurrent requests',async()=>{
 let timestamp=Date.parse('2026-10-10T02:00:00Z');
 const calls=[];
 const auth=createFamilyEmailAuth({
  config:publicConfig,now:()=>timestamp,fetcher:async(url,options)=>{
   calls.push(url);
   if(url.endsWith('/otp'))return ok({});
   if(url.endsWith('/verify'))return ok(verified());
   if(url.includes('/token?grant_type=refresh_token'))return ok(refreshed());
   throw Error('Unexpected request');
  }
 });
 await auth.requestCode('mom@example.com');
 await auth.verifyCode('123456');
 assert.equal(await auth.getAccessToken(),access);
 timestamp+=3571000;
 const tokens=await Promise.all([auth.getAccessToken(),auth.getAccessToken(),auth.getAccessToken()]);
 assert.deepEqual(tokens,[second,second,second]);
 assert.equal(calls.filter(x=>x.includes('/token?grant_type=refresh_token')).length,1);
 assert.equal(auth.getSession().accessToken,undefined);
});

test('logout clears local token even when server revocation is unavailable',async()=>{
 let logoutCalled=false;
 const auth=createFamilyEmailAuth({
  config:publicConfig,fetcher:async(url)=>{
   if(url.endsWith('/otp'))return ok({});
   if(url.endsWith('/verify'))return ok(verified());
   if(url.endsWith('/logout')){logoutCalled=true;throw Error('offline');}
   throw Error('Unexpected');
  }
 });
 await auth.requestCode('mom@example.com');
 await auth.verifyCode('123456');
 await auth.signOut();
 assert.equal(logoutCalled,true);
 assert.equal(auth.getSession(),null);
 await assert.rejects(()=>auth.getAccessToken(),e=>e.code==='SIGN_IN_REQUIRED');
});

test('untrusted provider errors are mapped to generic messages',async()=>{
 const auth=createFamilyEmailAuth({
  config:publicConfig,
  fetcher:async()=>bad(400,'this email address is not known')
 });
 await assert.rejects(()=>auth.requestCode('mom@example.com'),e=>
  e instanceof FamilyAuthError&&e.code==='AUTH_REQUEST_FAILED'&&!e.message.includes('not known')
 );
});
