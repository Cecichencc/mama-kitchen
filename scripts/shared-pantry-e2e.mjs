#!/usr/bin/env node
// DESTRUCTIVE TEST ONLY — Creates synthetic household, invitation, batch, events.
// Never run against production, personal accounts or real household data.
// This CLI is NOT part of normal GitHub Actions and runs only with an explicit
// matching test project ref, three distinct temporary JWTs, and acknowledgement.
import {createSharedPantryGateway} from '../public/phase0/shared-pantry-gateway.js';
import {runSharedPantryE2E} from './shared-pantry-e2e-core.mjs';

const env=process.env;
const required=[
 'KG_TEST_PROJECT_REF','KG_TEST_SUPABASE_URL','KG_TEST_PUBLISHABLE_KEY',
 'KG_TEST_OWNER_JWT','KG_TEST_MEMBER_JWT','KG_TEST_OUTSIDER_JWT',
 'KG_RUN_REMOTE_TESTS'
];
const missing=required.filter(k=>!env[k]);
const fail=message=>{console.error('Family Pantry E2E blocked: '+message);process.exitCode=1;};
const decodeJWTSub=token=>{
 const parts=token.split('.');
 if(parts.length!==3)throw Error('JWT does not contain three segments');
 const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
 if(typeof payload.sub!=='string'||payload.sub.length<10)throw Error('JWT missing subject');
 if(Number.isFinite(payload.exp)&&payload.exp*1000<=Date.now())throw Error('JWT expired');
 return payload.sub;
};
if(missing.length){
 fail('Missing settings: '+missing.join(', ')+'. Nothing sent to a server.');
}else if(!['I_CONFIRM_ISOLATED_TEST_PROJECT','READ_ONLY_PREFLIGHT'].includes(env.KG_RUN_REMOTE_TESTS)){
 fail('Use READ_ONLY_PREFLIGHT or explicitly confirm isolated-test mutations. Nothing sent.');
}else{
 try{
  const ref=env.KG_TEST_PROJECT_REF;
  if(!/^[a-z0-9]{6,40}$/.test(ref))throw Error('Invalid test project ref');
  const url=new URL(env.KG_TEST_SUPABASE_URL);
  if(url.protocol!=='https:'||url.hostname!==ref+'.supabase.co'||
    url.port||url.username||url.password||url.search||url.hash||
    url.pathname!=='/')
   throw Error('Test URL must be exactly https://<test-project-ref>.supabase.co/');
  if(!env.KG_TEST_PUBLISHABLE_KEY.startsWith('sb_publishable_'))
   throw Error('Use a public Supabase publishable key, never a secret/service-role key');
  const jwtByRole={
   owner:env.KG_TEST_OWNER_JWT,
   member:env.KG_TEST_MEMBER_JWT,
   outsider:env.KG_TEST_OUTSIDER_JWT
  };
  const subjects=Object.values(jwtByRole).map(decodeJWTSub);
  if(new Set(subjects).size!==3)throw Error('Three distinct test accounts required');
  const connection=jwt=>createSharedPantryGateway({
   url:url.origin,anonKey:env.KG_TEST_PUBLISHABLE_KEY,
   getAccessToken:()=>jwt
  });
  const owner=connection(jwtByRole.owner);
  const member=connection(jwtByRole.member);
  const outsider=connection(jwtByRole.outsider);
  if(env.KG_RUN_REMOTE_TESTS==='READ_ONLY_PREFLIGHT'){
   const accounts=[owner,member,outsider];
   await Promise.all(accounts.map(g=>g.listHouseholds()));
   console.log('PASS: isolated test project is reachable with three signed-in test accounts.');
   console.log('No test records created or modified.');
  }else{
   console.log('Running explicit test-only household creation and stock-conflict checks.');
   const result=await runSharedPantryE2E({
    owner,member,outsider,
    mark:step=>console.log('PASS: '+step)
   });
   console.log('PASS: '+result.checks+' groups of test-only household checks');
   console.log('Synthetic test household ID: '+result.householdId);
   console.log('Synthetic test batch ID: '+result.batchId);
   console.log('Test records remain in the isolated test project for audit and cleanup.');
  }
 }catch(error){
  // Never print provider error bodies, assertions with payloads, JWTs or invites.
  const allowed=new Set(['NOT_AUTHORIZED','AUTH_REQUIRED','INVALID_NAME',
   'INVALID_INVITE','HOUSEHOLD_FULL','ALREADY_MEMBER','INVALID_BATCH',
   'INVALID_CORRECTION','BATCH_NOT_FOUND','STALE_VERSION',
   'IDEMPOTENCY_KEY_REUSED','SIGN_IN_REQUIRED','NETWORK_UNAVAILABLE']);
  fail(allowed.has(error?.code)?error.code:
   'Integration verification failed. Review isolated test backend logs.');
 }
}
