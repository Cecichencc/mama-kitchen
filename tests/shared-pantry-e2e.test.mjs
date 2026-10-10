import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {runSharedPantryE2E} from '../scripts/shared-pantry-e2e-core.mjs';

const homeId='11111111-1111-4111-8111-111111111111';
const batchId='22222222-2222-4222-8222-222222222222';
const fakeId=(n)=>`33333333-3333-4333-8333-${String(n).padStart(12,'0')}`;
const failure=code=>Object.assign(new Error(code),{code});

function fakeSupabase({leakToOutsider=false}={}){
 const state={
  householdId:null,householdName:null,invite:null,inviteUsed:false,
  members:new Map(),batch:null,events:[],idempotency:new Map(),counter:0
 };
 const gateway=who=>{
  const member=()=>state.members.has(who);
  const guard=()=>{
   if(!member())throw failure('NOT_AUTHORIZED');
  };
  return {
   async listHouseholds(){
    return member()?[{id:homeId,name:state.householdName,timezone:'Asia/Singapore'}]:[];
   },
   async listMembers(id){return member()&&id===homeId?
    [...state.members].map(([user_id,role])=>({household_id:id,user_id,role})):[];
   },
   async readBatches(id){
    if(who==='outsider'&&leakToOutsider)return [{
     id:batchId,household_id:id,ingredient_id:'tomato',on_hand:3,
     unit:'piece',organic_status:'unknown',storage:'fridge',use_by:null,
     version:1,created_at:new Date().toISOString()
    }];
    return member()&&id===homeId&&state.batch?[{...state.batch}]:[];
   },
   async listEvents(id){
    return member()&&id===homeId?state.events.map(x=>({...x})):[];
   },
   async createHousehold(name){
    if(who!=='owner')throw failure('NOT_AUTHORIZED');
    state.householdId=homeId;state.householdName=name;
    state.members.set('owner','owner');return homeId;
   },
   async createInvite(id){
    guard();
    if(state.members.get(who)!=='owner'||id!==homeId)
     throw failure('NOT_AUTHORIZED');
    if(state.members.size>=2)throw failure('HOUSEHOLD_FULL');
    state.invite='a'.repeat(48);state.inviteUsed=false;return state.invite;
   },
   async joinInvite(code){
    if(code!==state.invite||state.inviteUsed)throw failure('INVALID_INVITE');
    if(state.members.has(who))throw failure('ALREADY_MEMBER');
    if(state.members.size>=2)throw failure('HOUSEHOLD_FULL');
    state.members.set(who,'member');state.inviteUsed=true;return homeId;
   },
   async addBatch(input){
    guard();
    if(input.householdId!==homeId)throw failure('NOT_AUTHORIZED');
    const prior=state.idempotency.get(input.requestId);
    if(prior){
     if(JSON.stringify(prior.input)!==JSON.stringify(input))
      throw failure('IDEMPOTENCY_KEY_REUSED');
     return {...state.batch};
    }
    if(state.batch)throw failure('INVALID_BATCH');
    state.batch={
     id:batchId,household_id:homeId,ingredient_id:input.ingredientId,
     on_hand:input.quantity,unit:'piece',
     organic_status:input.organicStatus,storage:input.storage,
     use_by:null,created_at:new Date().toISOString(),version:1
    };
    state.idempotency.set(input.requestId,{input:{...input}});
    state.events.push({event_type:'add',old_quantity:0,
     new_quantity:input.quantity,delta:input.quantity});
    return {...state.batch};
   },
   async correctBatch(input){
    guard();
    if(input.householdId!==homeId||input.batchId!==batchId)
     throw failure('BATCH_NOT_FOUND');
    if(state.batch.version!==input.expectedVersion)
     throw failure('STALE_VERSION');
    const old=state.batch.on_hand;
    state.batch.on_hand=input.onHand;
    state.batch.version++;
    state.events.push({event_type:'correct',old_quantity:old,
     new_quantity:input.onHand,delta:input.onHand-old});
    return {...state.batch};
   }
  };
 };
 return {owner:gateway('owner'),member:gateway('member'),
  outsider:gateway('outsider'),state};
}

test('isolated contract runner verifies three accounts, one-use invites and edit conflicts',async()=>{
 const mock=fakeSupabase();
 const stages=[],idGen={value:0};
 const result=await runSharedPantryE2E({
  owner:mock.owner,member:mock.member,outsider:mock.outsider,
  makeId:()=>fakeId(++idGen.value),mark:msg=>stages.push(msg)
 });
 assert.equal(result.status,'passed');
 assert.equal(result.checks,4);
 assert.equal(stages.length,4);
 assert.equal(result.householdId,homeId);
 assert.equal(result.batchId,batchId);
 assert.equal(mock.state.events.length,2);
 assert.equal(mock.state.members.size,2);
 assert.equal(mock.state.inviteUsed,true);
});

test('contract runner catches broken RLS isolation rather than passing unsafe backend',async()=>{
 const mock=fakeSupabase({leakToOutsider:true});
 await assert.rejects(()=>runSharedPantryE2E({
  owner:mock.owner,member:mock.member,outsider:mock.outsider,
  makeId:()=>fakeId(1)
 }),/Outside accounts must see no household stock/);
});

test('live script is fail-closed without explicit external credentials',()=>{
 const cwd=fileURLToPath(new URL('../',import.meta.url));
 const program=fileURLToPath(new URL('../scripts/shared-pantry-e2e.mjs',import.meta.url));
 const result=spawnSync(process.execPath,[program],{
  cwd,encoding:'utf8',env:{PATH:process.env.PATH||''}
 });
 assert.equal(result.status,1);
 assert.match(result.stderr,/Missing settings/);
 assert.match(result.stderr,/Nothing sent to a server/);
 assert.doesNotMatch(result.stdout,/PASS:/);
});

test('integration script keeps remote-run gates and never logs secrets',()=>{
 const runner=fileURLToPath(new URL('../scripts/shared-pantry-e2e.mjs',import.meta.url));
 const textSource=requireRead(runner);
 assert.match(textSource,/KG_RUN_REMOTE_TESTS/);
 assert.match(textSource,/I_CONFIRM_ISOLATED_TEST_PROJECT/);
 assert.match(textSource,/KG_TEST_PROJECT_REF/);
 assert.match(textSource,/\.supabase\.co/);
 assert.match(textSource,/Three distinct test accounts required/);
 assert.doesNotMatch(textSource,/console\.log\([^)]*(?:JWT|publishableKey|invite)/i);
});
function requireRead(path){return readFileSync(path,'utf8');}
