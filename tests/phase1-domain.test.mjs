import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyState,loadState,checkState,addGroceries,correctStock,reserve,setReservation,clearBasket,
  expireBasket,confirmCooked,physicalTotal,usableTotal,heldQuantity,basketQuantity,hasMixedSource,
  recipeReadiness,RESERVATION_MS,STORAGE_KEY
} from '../public/phase0/domain.js';

const now=Date.parse('2026-10-08T12:30:00Z');
const plus=d=>now+d;
function setup(tomatoSource='organic',eggSource='organic'){
  let s=emptyState();
  s=addGroceries(s,{ingredientId:'tomato',quantity:6,organicStatus:tomatoSource,storage:'fridge'},now);
  s=addGroceries(s,{ingredientId:'egg',quantity:8,organicStatus:eggSource,storage:'fridge'},now);
  return {state:s,tomato:s.batches[0].id,egg:s.batches[1].id};
}
function basketFull(s,ids){
  s=reserve(s,{batchId:ids.tomato,quantity:2},now);
  s=reserve(s,{batchId:ids.egg,quantity:3},now);
  return s;
}
function lines(ids,tomato=2,egg=3){return [{batchId:ids.tomato,quantity:tomato},{batchId:ids.egg,quantity:egg}];}

test('local state starts at zero: never invent grocery quantities',()=>{
  const s=emptyState();
  assert.equal(physicalTotal(s,'tomato'),0);assert.equal(physicalTotal(s,'egg'),0);
  assert.equal(usableTotal(s,'tomato',now),0);assert.equal(s.basket.lines.length,0);
  assert.equal(s.sessions.length,0);assert.equal(STORAGE_KEY,'kitchen-garden.phase1.v1');
});
test('required vertical slice: add 6/8, harvest 2/3, cook -> precisely 4/5',()=>{
  const x=setup();let s=basketFull(x.state,x);
  assert.equal(physicalTotal(s,'tomato'),6);assert.equal(physicalTotal(s,'egg'),8);
  assert.equal(heldQuantity(s,x.tomato),2);assert.equal(heldQuantity(s,x.egg),3);
  assert.equal(usableTotal(s,'tomato',now),4);assert.equal(usableTotal(s,'egg',now),5);
  assert.equal(recipeReadiness(s).possible,true);
  s=confirmCooked(s,{key:'cook-1',actualLines:lines(x)},now);
  assert.equal(physicalTotal(s,'tomato'),4);assert.equal(physicalTotal(s,'egg'),5);
  assert.equal(s.basket.lines.length,0);assert.equal(s.sessions.length,1);
  assert.equal(s.sessions[0].servingsPrepared,2);assert.equal(s.sessions[0].servingsEaten,null);
  assert.equal(s.movements.filter(m=>m.type==='cooked').length,2);
  assert.ok(checkState(s));
});
test('harvest is only a reservation; releasing it does not use ingredients',()=>{
  const x=setup();let s=reserve(x.state,{batchId:x.tomato,quantity:4},now);
  assert.equal(physicalTotal(s,'tomato'),6);
  s=setReservation(s,{batchId:x.tomato,quantity:1},now);
  assert.equal(usableTotal(s,'tomato',now),5);
  s=clearBasket(s,now);
  assert.equal(physicalTotal(s,'tomato'),6);assert.equal(usableTotal(s,'tomato',now),6);
});
test('reservations never exceed stock or accept negative/fractional harvest',()=>{
  const x=setup();
  assert.throws(()=>reserve(x.state,{batchId:x.tomato,quantity:7},now),/Not enough/);
  assert.throws(()=>reserve(x.state,{batchId:x.tomato,quantity:-1},now),/whole number/);
  assert.throws(()=>reserve(x.state,{batchId:x.tomato,quantity:1.5},now),/whole number/);
  assert.throws(()=>setReservation(x.state,{batchId:x.tomato,quantity:-1},now),/whole number/);
});
test('out-of-stock and regrowth use derived available count only',()=>{
  const x=setup();let s=reserve(x.state,{batchId:x.tomato,quantity:6},now);
  assert.equal(physicalTotal(s,'tomato'),6);
  assert.equal(usableTotal(s,'tomato',now),0);
  s=setReservation(s,{batchId:x.tomato,quantity:5},now);
  assert.equal(usableTotal(s,'tomato',now),1);
});
test('a 30-minute stale basket expires with no stock deduction',()=>{
  const x=setup();const s=reserve(x.state,{batchId:x.tomato,quantity:2},now);
  assert.equal(expireBasket(s,plus(RESERVATION_MS-1)),s);
  const expired=expireBasket(s,plus(RESERVATION_MS));
  assert.equal(physicalTotal(expired,'tomato'),6);
  assert.equal(expired.basket.lines.length,0);
  assert.equal(usableTotal(expired,'tomato',plus(RESERVATION_MS)),6);
});
test('load and reload preserve amounts, while old basket holds expire',()=>{
  const x=setup();const s=reserve(x.state,{batchId:x.tomato,quantity:3},now);
  const loaded=loadState(JSON.stringify(s),plus(40*60*1000));
  assert.equal(loaded.basket.lines.length,0);
  assert.equal(physicalTotal(loaded,'tomato'),6);
});
test('cooking submission is idempotent',()=>{
  const x=setup();const s=basketFull(x.state,x);
  const cook={key:'stable-submit-key',actualLines:lines(x)};
  const done=confirmCooked(s,cook,now);
  assert.equal(confirmCooked(done,cook,now),done);
  assert.equal(physicalTotal(done,'tomato'),4);
  assert.equal(done.sessions.length,1);
});
test('rejected cooking validation never changes input state',()=>{
  const x=setup(),s=basketFull(x.state,x);
  const snapshot=JSON.stringify(s);
  assert.throws(()=>confirmCooked(s,{key:'bad',actualLines:lines(x,12,3)},now),/Not enough/);
  assert.equal(JSON.stringify(s),snapshot);
  assert.equal(physicalTotal(s,'tomato'),6);
});
test('actual cooking quantities may differ from harvested quantities with validation',()=>{
  const x=setup();let s=basketFull(x.state,x);
  s=confirmCooked(s,{key:'smaller-real-use',actualLines:lines(x,1,2)},now);
  assert.equal(physicalTotal(s,'tomato'),5);assert.equal(physicalTotal(s,'egg'),6);
});
test('recipe preview requires 2 tomatoes and 3 eggs for intended two-person preparation',()=>{
  const x=setup();let s=reserve(x.state,{batchId:x.tomato,quantity:1},now);
  s=reserve(s,{batchId:x.egg,quantity:1},now);
  assert.equal(recipeReadiness(s).possible,false);
  s=setReservation(s,{batchId:x.tomato,quantity:2},now);
  s=setReservation(s,{batchId:x.egg,quantity:3},now);
  assert.equal(recipeReadiness(s).possible,true);
  assert.equal(basketQuantity(s,'egg'),3);
});
test('non-organic or unknown sourcing requires explicit shared-dish acknowledgement',()=>{
  const x=setup('organic','nonorganic');const s=basketFull(x.state,x);
  assert.equal(hasMixedSource(s),true);
  assert.throws(()=>confirmCooked(s,{key:'mixed',actualLines:lines(x)},now),/non-organic/);
  const done=confirmCooked(s,{key:'mixed',actualLines:lines(x),ackMixed:true},now);
  assert.equal(done.sessions[0].sourceStatus,'mixed');
});
test('organic-only dish retains its sourcing label, not medical safety claims',()=>{
  const x=setup(),s=basketFull(x.state,x);
  const cooked=confirmCooked(s,{key:'organic-only',actualLines:lines(x)},now);
  assert.equal(cooked.sessions[0].sourceStatus,'organic');
});
test('separate organic and nonorganic ingredient batches do not silently merge',()=>{
  const x=setup();const extra=addGroceries(x.state,{ingredientId:'tomato',quantity:3,organicStatus:'nonorganic'},now);
  assert.equal(extra.batches.filter(b=>b.ingredientId==='tomato').length,2);
  assert.equal(physicalTotal(extra,'tomato'),9);
  assert.equal(extra.batches[0].organicStatus,'organic');
  assert.equal(extra.batches[2].organicStatus,'nonorganic');
});
test('correcting stock below held amount fails without deleting reservation',()=>{
  const x=setup();const s=reserve(x.state,{batchId:x.tomato,quantity:4},now);
  assert.throws(()=>correctStock(s,{batchId:x.tomato,onHand:1},now),/Release reserved/);
  assert.equal(physicalTotal(s,'tomato'),6);
  assert.equal(heldQuantity(s,x.tomato),4);
});
test('used-up correction updates real stock and movement history',()=>{
  const x=setup();const s=correctStock(x.state,{batchId:x.egg,onHand:0,reason:'used-outside'},now);
  assert.equal(physicalTotal(s,'egg'),0);
  assert.equal(s.movements.at(-1).delta,-8);
  assert.equal(s.movements.at(-1).type,'used-outside');
});
test('past use-by is blocked for reservation and not recommended as available',()=>{
  let s=addGroceries(emptyState(),{ingredientId:'tomato',quantity:4,useBy:'2026-10-07'},now);
  assert.equal(physicalTotal(s,'tomato'),4);
  assert.equal(usableTotal(s,'tomato',now),0);
  assert.throws(()=>reserve(s,{batchId:s.batches[0].id,quantity:1},now),/use-by/);
});
test('invalid date, quantity and source values are rejected',()=>{
  assert.throws(()=>addGroceries(emptyState(),{ingredientId:'tomato',quantity:1.2},now),/whole number/);
  assert.throws(()=>addGroceries(emptyState(),{ingredientId:'tomato',quantity:1,organicStatus:'organic-ish'},now),/valid ingredient source/);
  assert.throws(()=>addGroceries(emptyState(),{ingredientId:'tomato',quantity:1,useBy:'2026-02-30'},now),/YYYY-MM-DD/);
});
test('old or malformed local data is not silently coerced into stock',()=>{
  assert.throws(()=>loadState('{bad json',now),SyntaxError);
  assert.throws(()=>loadState(JSON.stringify({schema:2,batches:[]}),now),/Unsupported/);
});
