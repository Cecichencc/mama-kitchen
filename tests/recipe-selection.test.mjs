import test from 'node:test';import assert from 'node:assert/strict';
import {emptyState,addGroceries,correctStock,physicalTotal,usableTotal} from '../public/phase0/domain.js';
import {emptySelection,sanitizeSelection,selectQuantity,selectedQuantity,selectionReadiness} from '../public/phase0/recipe-selection.js';
const now=Date.parse('2026-10-09T02:00:00Z');
function setup(){let state=emptyState();state=addGroceries(state,{ingredientId:'tomato',quantity:6},now);state=addGroceries(state,{ingredientId:'egg',quantity:8},now);return state;}
test('selecting 2 tomatoes and 3 eggs never reserves or deducts stock',()=>{
 const s=setup();let basket=emptySelection();
 basket=selectQuantity(basket,s.batches,s.batches[0].id,2);
 basket=selectQuantity(basket,s.batches,s.batches[1].id,3);
 assert.equal(selectionReadiness(basket,s.batches).possible,true);
 assert.equal(physicalTotal(s,'tomato'),6);assert.equal(physicalTotal(s,'egg'),8);
 assert.equal(usableTotal(s,'tomato',now),6);assert.equal(usableTotal(s,'egg',now),8);
 assert.deepEqual(s.basket.lines,[]);
});
test('physical stock correction is never blocked by recipe selections',()=>{
 let s=setup();let basket=selectQuantity(emptySelection(),s.batches,s.batches[0].id,6);
 s=correctStock(s,{batchId:s.batches[0].id,onHand:0,reason:'used-outside'},now);
 basket=sanitizeSelection(basket,s.batches);
 assert.equal(basket.lines.length,0);assert.equal(physicalTotal(s,'tomato'),0);
});
test('quantity selection validates and clamps after stock correction',()=>{
 const s=setup();assert.throws(()=>selectQuantity(emptySelection(),s.batches,s.batches[0].id,7),/Not enough/);
 let basket=selectQuantity(emptySelection(),s.batches,s.batches[0].id,4);
 s.batches[0].onHand=2;basket=sanitizeSelection(basket,s.batches);
 assert.equal(selectedQuantity(basket,s.batches,'tomato'),2);
});
test('legacy held basket migrates as selections without affecting physical stock',()=>{
 const s=setup();const old={lines:[{batchId:s.batches[0].id,quantity:2}]};
 const next=sanitizeSelection(old,s.batches);
 assert.equal(next.lines[0].quantity,2);assert.equal(physicalTotal(s,'tomato'),6);
});
