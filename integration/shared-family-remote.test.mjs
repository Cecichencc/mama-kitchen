// Runs ONLY by explicit command with three authenticated TEST-account JWTs.
// This creates test household, invitation, batch and audit records in the
// specified isolated Supabase project; it does NOT delete data afterward.
// NEVER use production/project with real household data.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {validateRemoteFamilyTestEnvironment} from './remote-test-guard.mjs';
import {createSharedPantryGateway} from '../public/phase0/shared-pantry-gateway.js';

const config=validateRemoteFamilyTestEnvironment(process.env);
const gateway=jwt=>createSharedPantryGateway({
 url:config.url,anonKey:config.publishableKey,
 getAccessToken:async()=>jwt
});
const owner=gateway(config.ownerJWT);
const member=gateway(config.memberJWT);
const outsider=gateway(config.outsiderJWT);
const errCode=code=>error=>error?.code===code;
const isUuid=value=>typeof value==='string'&&
 /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

test('isolated three-user shared Pantry: membership, RLS, invite and stock concurrency',
 {timeout:120000},async t=>{
  let householdId,otherId,batchId;
  const suffix=randomUUID().slice(0,8);
  await t.test('owner and unrelated third user have separate household rows',async()=>{
   householdId=await owner.createHousehold('Kitchen Garden E2E '+suffix);
   otherId=await outsider.createHousehold('Unrelated E2E '+suffix);
   assert.ok(isUuid(householdId));
   assert.ok(isUuid(otherId));
   assert.notEqual(householdId,otherId);
   assert.ok((await owner.listHouseholds()).some(row=>row.id===householdId));
   assert.ok((await outsider.listHouseholds()).every(row=>row.id!==householdId));
   assert.ok((await member.listHouseholds()).every(row=>row.id!==householdId));
   assert.deepEqual(await outsider.readBatches(householdId),[]);
   assert.deepEqual(await owner.readBatches(otherId),[]);
   assert.deepEqual(await outsider.readEvents(householdId),[]);
  });

  await t.test('private owner-issued invite joins one member and rejects outsiders',async()=>{
   await assert.rejects(()=>member.createInvite(householdId),errCode('NOT_AUTHORIZED'));
   await assert.rejects(()=>outsider.createInvite(householdId),errCode('NOT_AUTHORIZED'));
   const validCode=await owner.createInvite(householdId);
   const spareCode=await owner.createInvite(householdId);
   // Never print invitation codes, even on failure.
   assert.equal(typeof validCode,'string');
   assert.equal(validCode.length,48);
   assert.ok(/^[a-f0-9]{48}$/.test(validCode));
   assert.ok(/^[a-f0-9]{48}$/.test(spareCode));
   assert.equal(await member.joinInvite(validCode),householdId);
   assert.ok((await member.listHouseholds()).some(row=>row.id===householdId));
   assert.equal((await owner.listMembers(householdId)).length,2);
   await assert.rejects(()=>member.joinInvite(validCode),errCode('INVALID_INVITE'));
   await assert.rejects(()=>outsider.joinInvite(validCode),errCode('INVALID_INVITE'));
   await assert.rejects(()=>outsider.joinInvite(spareCode),errCode('HOUSEHOLD_FULL'));
   await assert.rejects(()=>owner.createInvite(householdId),errCode('HOUSEHOLD_FULL'));
   await assert.rejects(()=>member.createInvite(householdId),errCode('NOT_AUTHORIZED'));
  });

  await t.test('authoritative stock and idempotency protect against duplicate adds',async()=>{
   const requestId=randomUUID();
   const input={householdId,ingredientId:'tomato',quantity:6,
    organicStatus:'organic',storage:'fridge',requestId};
   const first=await owner.addBatch(input);
   batchId=first.id;
   assert.ok(isUuid(batchId));
   assert.equal(first.on_hand,6);
   assert.equal(first.version,1);
   assert.equal(first.organic_status,'organic');
   const replay=await owner.addBatch(input);
   assert.equal(replay.id,batchId);
   assert.equal((await owner.readBatches(householdId)).length,1);
   assert.equal((await member.readBatches(householdId))[0].on_hand,6);
   await assert.rejects(()=>owner.addBatch({...input,quantity:7}),
    errCode('IDEMPOTENCY_KEY_REUSED'));
   assert.equal((await owner.readEvents(householdId)).length,1);
   await assert.rejects(()=>outsider.addBatch({
    householdId,ingredientId:'tomato',quantity:1,
    organicStatus:'organic',storage:'fridge',requestId:randomUUID()
   }),errCode('NOT_AUTHORIZED'));
   assert.deepEqual(await outsider.readBatches(householdId),[]);
  });

  await t.test('stale phone cannot overwrite another member; audit deltas are accurate',async()=>{
   const staleVersion=(await member.readBatches(householdId))[0].version;
   const corrected=await owner.correctBatch({
    householdId,batchId,onHand:4,expectedVersion:staleVersion,
    reason:'count',requestId:randomUUID()
   });
   assert.equal(corrected.version,2);
   assert.equal(corrected.on_hand,4);
   await assert.rejects(()=>member.correctBatch({
    householdId,batchId,onHand:5,expectedVersion:staleVersion,
    reason:'count',requestId:randomUUID()
   }),errCode('STALE_VERSION'));
   const fresh=(await member.readBatches(householdId))[0];
   assert.equal(fresh.version,2);
   assert.equal(fresh.on_hand,4);
   const second=await member.correctBatch({
    householdId,batchId,onHand:2,expectedVersion:fresh.version,
    reason:'count',requestId:randomUUID()
   });
   assert.equal(second.version,3);
   await assert.rejects(()=>outsider.correctBatch({
    householdId,batchId,onHand:1,expectedVersion:3,
    reason:'count',requestId:randomUUID()
   }),errCode('NOT_AUTHORIZED'));
   const events=await owner.readEvents(householdId);
   assert.equal(events.length,3);
   assert.deepEqual(events.map(e=>e.delta),[6,-2,-2]);
   assert.deepEqual(events.map(e=>e.old_quantity),[0,6,4]);
   assert.deepEqual(events.map(e=>e.new_quantity),[6,4,2]);
   assert.deepEqual(await outsider.readEvents(householdId),[]);
  });

  await t.test('truly concurrent writes allow exactly one winner, no silent last-write',async()=>{
   const [a,b]=await Promise.allSettled([
    owner.correctBatch({householdId,batchId,onHand:1,expectedVersion:3,
     reason:'count',requestId:randomUUID()}),
    member.correctBatch({householdId,batchId,onHand:0,expectedVersion:3,
     reason:'count',requestId:randomUUID()})
   ]);
   const successes=[a,b].filter(x=>x.status==='fulfilled');
   const conflicts=[a,b].filter(x=>x.status==='rejected');
   assert.equal(successes.length,1);
   assert.equal(conflicts.length,1);
   assert.equal(conflicts[0].reason?.code,'STALE_VERSION');
   const final=(await owner.readBatches(householdId)).find(x=>x.id===batchId);
   assert.equal(final.version,4);
   assert.ok(final.on_hand===0||final.on_hand===1);
   assert.equal((await member.readBatches(householdId))[0].on_hand,final.on_hand);
   assert.equal((await owner.readEvents(householdId)).length,4);
   assert.deepEqual(await outsider.readBatches(householdId),[]);
  });
 });
