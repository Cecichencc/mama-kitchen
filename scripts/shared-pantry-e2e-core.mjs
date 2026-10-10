// Integration contract runner for an ISOLATED Supabase test project.
// This creates one synthetic household and batch. It is never part of normal CI,
// never uses real grocery data, and never contains or prints user credentials.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {toReadOnlyInventory} from '../public/phase0/shared-pantry-session.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOGIN_ERRORS=new Set(['NOT_AUTHORIZED','SIGN_IN_REQUIRED']);
const ensureUuid=(v,name)=>assert.match(v||'',UUID,name+' must be a UUID');
const unpack=payload=>{
 if(typeof payload==='string')return payload;
 if(Array.isArray(payload))return unpack(payload[0]);
 return payload;
};
const forbidden=async(promise,allowed)=>{
 await assert.rejects(promise,error=>allowed.includes(error?.code),
  'Request must fail with one of: '+allowed.join(', '));
};
const verifyHidden=async(gateway,householdId)=>{
 let rows;
 try{rows=await gateway.readBatches(householdId);}
 catch(error){
  if(LOGIN_ERRORS.has(error?.code))return; // An explicit 401/403 is acceptable.
  throw error;
 }
 // RLS often returns [] rather than a 403 for denied SELECT.
 assert.deepEqual(rows,[],'Outside accounts must see no household stock');
};
export async function runSharedPantryE2E({
 owner,member,outsider,mark=()=>{},makeId=randomUUID
}){
 for(const [who,gateway] of Object.entries({owner,member,outsider})){
  for(const action of ['listHouseholds','listMembers','readBatches',
   'listEvents','createHousehold','createInvite','joinInvite',
   'addBatch','correctBatch'])
   assert.equal(typeof gateway?.[action],'function',who+' missing '+action);
 }
 const name='KG TEST ONLY '+makeId().slice(0,8);
 const household=unpack(await owner.createHousehold(name));
 ensureUuid(household,'household');
 mark('Created test-only household');
 const ownerHomes=await owner.listHouseholds();
 assert.ok(ownerHomes.some(h=>h.id===household),'Owner cannot see new household');
 const initialMembers=await owner.listMembers(household);
 assert.equal(initialMembers.length,1);
 assert.equal(initialMembers[0].role,'owner');
 await verifyHidden(outsider,household);
 await forbidden(()=>outsider.createInvite(household),['NOT_AUTHORIZED']);
 await forbidden(()=>member.createInvite(household),['NOT_AUTHORIZED']);
 const invite=unpack(await owner.createInvite(household));
 assert.match(invite,/^[0-9a-f]{48}$/,'Invitation must be random 48-hex code');
 const wrong='0'.repeat(48)===invite?'1'.repeat(48):'0'.repeat(48);
 await forbidden(()=>member.joinInvite(wrong),['INVALID_INVITE']);
 assert.equal(unpack(await member.joinInvite(invite)),household);
 const members=await owner.listMembers(household);
 assert.equal(members.length,2,'Exactly two household members expected');
 assert.deepEqual(members.map(x=>x.role).sort(),['member','owner']);
 await forbidden(()=>outsider.joinInvite(invite),['INVALID_INVITE']);
 await forbidden(()=>owner.createInvite(household),['HOUSEHOLD_FULL']);
 await forbidden(()=>member.createInvite(household),['NOT_AUTHORIZED']);
 const outsiderHomes=await outsider.listHouseholds();
 assert.ok(!outsiderHomes.some(x=>x.id===household),
  'Unrelated user must not see the household');
 mark('Verified invitation lifecycle and member isolation');

 const requestId=makeId();
 const input={householdId:household,ingredientId:'tomato',quantity:6,
  organicStatus:'organic',storage:'fridge',requestId};
 await forbidden(()=>outsider.addBatch({...input,requestId:makeId()}),['NOT_AUTHORIZED']);
 const row=unpack(await owner.addBatch(input));
 ensureUuid(row.id,'batch');
 assert.equal(row.on_hand,6);
 assert.equal(row.unit,'piece');
 assert.equal(row.organic_status,'organic');
 assert.equal(row.version,1);
 await owner.addBatch(input); // Same request UUID must not add a second batch.
 await forbidden(()=>owner.addBatch({...input,quantity:7}),['IDEMPOTENCY_KEY_REUSED']);
 const ownerRead=await owner.readBatches(household);
 const memberRead=await member.readBatches(household);
 assert.equal(ownerRead.length,1,'Idempotent add created duplicate batch');
 assert.equal(memberRead.length,1,'Member cannot see shared stock');
 assert.equal(memberRead[0].id,row.id);
 assert.equal(toReadOnlyInventory(memberRead,household).batches[0].onHand,6);
 await verifyHidden(outsider,household);
 assert.equal((await owner.listEvents(household)).length,1,
  'An idempotent batch add must record exactly one movement');
 mark('Verified cross-account reading and idempotent additions');

 const writes=await Promise.allSettled([
  owner.correctBatch({householdId:household,batchId:row.id,expectedVersion:1,
   onHand:4,reason:'count',requestId:makeId()}),
  member.correctBatch({householdId:household,batchId:row.id,expectedVersion:1,
   onHand:5,reason:'count',requestId:makeId()})
 ]);
 const accepted=writes.filter(x=>x.status==='fulfilled');
 const rejected=writes.filter(x=>x.status==='rejected');
 assert.equal(accepted.length,1,'Exactly one simultaneous edit must succeed');
 assert.equal(rejected.length,1,'Stale simultaneous edit must fail');
 assert.equal(rejected[0].reason?.code,'STALE_VERSION');
 const finalRows=await member.readBatches(household);
 assert.equal(finalRows.length,1);
 assert.equal(finalRows[0].version,2);
 assert.ok([4,5].includes(finalRows[0].on_hand));
 assert.equal(finalRows[0].organic_status,'organic');
 const movements=await member.listEvents(household);
 assert.equal(movements.length,2,
  'One add + one correction must produce exactly two events');
 assert.deepEqual(movements.map(x=>x.event_type),['add','correct']);
 assert.equal(movements[1].old_quantity,6);
 assert.equal(movements[1].new_quantity,finalRows[0].on_hand);
 assert.equal(movements[1].delta,finalRows[0].on_hand-6);
 await verifyHidden(outsider,household);
 mark('Verified two-device stale-version rejection and audit deltas');
 return {
  status:'passed',
  checks:4,
  // IDs are test-only and safe for correlation. Never return invite or JWT.
  householdId:household,
  batchId:row.id,
  finalStock:finalRows[0].on_hand
 };
}
