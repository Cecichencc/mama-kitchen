import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,addGroceries,physicalTotal} from '../public/phase0/domain.js';
import {createSharedPantryGateway,SharedPantryError} from '../public/phase0/shared-pantry-gateway.js';
import {
 toReadOnlyInventory,previewLocalInventoryTransfer,
 createSharedPantrySession,FAMILY_SYNC_STATUS
} from '../public/phase0/shared-pantry-session.js';

const home='11111111-1111-4111-8111-111111111111';
const batch='22222222-2222-4222-8222-222222222222';
const requestId='33333333-3333-4333-8333-333333333333';
const createdAt='2026-10-10T06:00:00.000Z';
const remoteRow={id:batch,household_id:home,ingredient_id:'tomato',
 on_hand:6,unit:'piece',organic_status:'organic',
 storage:'fridge',use_by:null,version:1,created_at:createdAt};

const gateway=(fetcher,accessToken='user-token')=>createSharedPantryGateway({
 url:'https://example.supabase.co',anonKey:'public-test-key',
 getAccessToken:()=>accessToken,fetcher,makeRequestId:()=>requestId
});
const ok=(value)=>({ok:true,status:200,json:async()=>value});
const fail=(status,message)=>({ok:false,status,json:async()=>({message})});

test('shared connection requires HTTPS, public key and authenticated token provider',()=>{
 assert.throws(()=>createSharedPantryGateway({
   url:'http://example.supabase.co',anonKey:'public-test-key',
   getAccessToken:()=> 'user-token',fetcher:async()=>ok([])
 }),/SYNC_CONFIGURATION_REQUIRED/);
 assert.throws(()=>createSharedPantryGateway({
   url:'https://example.supabase.co',anonKey:'',
   getAccessToken:()=> 'user-token',fetcher:async()=>ok([])
 }),/SYNC_CONFIGURATION_REQUIRED/);
});
test('no authenticated JWT means no remote call or implied sharing',async()=>{
 let calls=0;
 const api=gateway(async()=>{calls++;return ok([])},'');
 await assert.rejects(()=>api.listHouseholds(),error=>
  error instanceof SharedPantryError&&error.code==='SIGN_IN_REQUIRED');
 assert.equal(calls,0);
});
test('reading a household sends bearer token and user-scoped REST request',async()=>{
 const requests=[];
 const api=gateway(async(url,options)=>{requests.push({url,options});return ok([remoteRow])});
 const rows=await api.readBatches(home);
 assert.equal(rows[0].on_hand,6);
 assert.equal(requests.length,1);
 assert.match(requests[0].url,/kg_batches\?select=/);
 assert.ok(requests[0].url.includes('household_id=eq.'+home));
 assert.equal(requests[0].options.headers.Authorization,'Bearer user-token');
 assert.equal(requests[0].options.headers.apikey,'public-test-key');
 assert.equal(requests[0].options.cache,'no-store');
});
test('untrusted household identifiers are rejected before fetch',async()=>{
 let calls=0;
 const api=gateway(async()=>{calls++;return ok([])});
 assert.throws(()=>api.readBatches('eq.all%25'),/INVALID_HOUSEHOLD/);
 assert.equal(calls,0);
});
test('add converts kg to grams using idempotency key, never client-side stock writes',async()=>{
 const requests=[];
 const api=gateway(async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return ok(remoteRow)});
 await api.addBatch({householdId:home,ingredientId:'rice',quantity:1.5,inputUnit:'kg',
  organicStatus:'unknown',storage:'pantry',requestId});
 assert.equal(requests[0].url,'https://example.supabase.co/rest/v1/rpc/kg_add_batch');
 assert.equal(requests[0].body.p_quantity,1500);
 assert.equal(requests[0].body.p_unit,'g');
 assert.equal(requests[0].body.p_request_id,requestId);
 assert.throws(()=>api.addBatch({householdId:home,ingredientId:'egg',
  quantity:1.5,organicStatus:'unknown',storage:'fridge'}),/INVALID_QUANTITY/);
 assert.equal(requests.length,1);
});
test('stale-version errors pass through without optimistic overwrite',async()=>{
 const api=gateway(async()=>fail(409,'STALE_VERSION'));
 await assert.rejects(()=>api.correctBatch({
  householdId:home,batchId:batch,expectedVersion:1,
  onHand:2,reason:'count',requestId
 }),error=>error.code==='STALE_VERSION'&&error.status===409);
});
test('remote snapshots retain batch IDs, versions, source and proper local shape',()=>{
 const state=toReadOnlyInventory([remoteRow],home);
 assert.equal(state.schema,1);
 assert.equal(state.batches[0].id,batch);
 assert.equal(state.batches[0].organicStatus,'organic');
 assert.equal(state.batches[0].version,1);
 assert.equal(physicalTotal(state,'tomato'),6);
 assert.equal(state.basket.lines.length,0);
 assert.throws(()=>toReadOnlyInventory([{...remoteRow,household_id:'other'}],home),/Invalid household batch/);
 assert.throws(()=>toReadOnlyInventory([{...remoteRow,unit:'kg'}],home),/Unsupported server batch/);
});
test('local migration preview does not upload or mutate actual grocery records',()=>{
 const now=Date.parse('2026-10-10T06:00:00.000Z');
 let local=addGroceries(emptyState(),{ingredientId:'tomato',quantity:4,organicStatus:'organic'},now);
 local=addGroceries(local,{ingredientId:'egg',quantity:2,useBy:'2026-10-12'},now);
 const before=JSON.stringify(local);
 const preview=previewLocalInventoryTransfer(local);
 assert.deepEqual(preview,{batchCount:2,datedCount:1,
  ingredientCount:2,totals:{tomato:4,egg:2},requiresExplicitConfirmation:true});
 assert.equal(JSON.stringify(local),before);
});
test('connected session never edits local stock before server confirms',async()=>{
 let server=[{...remoteRow}];
 const observed=[];
 const fake={
  readBatches:async()=>server.map(x=>({...x})),
  addBatch:async()=>{server=[{...remoteRow,on_hand:8,version:2}];return server[0]},
  correctBatch:async()=>{throw Object.assign(new Error('stale'),{code:'STALE_VERSION'})}
 };
 const session=createSharedPantrySession({
  gateway:fake,householdId:home,onSnapshot:s=>observed.push(s)
 });
 assert.equal(session.getStatus(),FAMILY_SYNC_STATUS.LOCAL);
 await assert.rejects(()=>session.addGroceries({ingredientId:'tomato',quantity:2}),/offline or not connected/);
 await session.refresh();
 assert.equal(session.getStatus(),FAMILY_SYNC_STATUS.ONLINE);
 assert.equal(session.snapshot().batches[0].onHand,6);
 await session.addGroceries({ingredientId:'tomato',quantity:2});
 assert.equal(session.snapshot().batches[0].onHand,8);
 const previouslyRead=session.snapshot();
 previouslyRead.batches[0].onHand=999;
 assert.equal(session.snapshot().batches[0].onHand,8);
 await assert.rejects(()=>session.correctStock({batchId:batch,onHand:1}),/stale/);
 assert.equal(session.getStatus(),FAMILY_SYNC_STATUS.ONLINE); // conflict triggered a fresh read
 assert.equal(session.snapshot().batches[0].onHand,8);
 assert.ok(observed.length>=3);
 session.disconnect();
 assert.equal(session.getStatus(),FAMILY_SYNC_STATUS.LOCAL);
 assert.throws(()=>session.snapshot(),/No authoritative/);
});
test('network failures put remote session into offline mode without fake success',async()=>{
 const session=createSharedPantrySession({
  gateway:{
   readBatches:async()=>{throw Object.assign(new Error('no network'),{code:'NETWORK_UNAVAILABLE'})},
   addBatch:async()=>{throw Error('should never be called')},
   correctBatch:async()=>{throw Error('should never be called')}
  },
  householdId:home
 });
 await assert.rejects(()=>session.refresh(),/no network/);
 assert.equal(session.getStatus(),FAMILY_SYNC_STATUS.OFFLINE);
 await assert.rejects(()=>session.correctStock({batchId:batch,onHand:0}),/offline or not connected/);
});

test('read-only event audit query is scoped by household and carries auth token',async()=>{
 const requests=[];
 const audit={id:'44444444-4444-4444-8444-444444444444',household_id:home,
  batch_id:batch,event_type:'add',delta:6,old_quantity:0,new_quantity:6};
 const api=gateway(async(url,options)=>{requests.push({url,options});return ok([audit]);});
 const events=await api.readEvents(home);
 assert.equal(events.length,1);
 assert.equal(events[0].delta,6);
 assert.equal(requests[0].options.method,'GET');
 assert.match(requests[0].url,/\/rest\/v1\/kg_events\?select=/);
 assert.ok(requests[0].url.includes('household_id=eq.'+home));
 assert.equal(requests[0].options.headers.Authorization,'Bearer user-token');
 assert.equal(requests[0].options.body,undefined);
 assert.throws(()=>api.readEvents('not-a-uuid'),/INVALID_HOUSEHOLD/);
});
