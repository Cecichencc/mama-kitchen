import test from 'node:test';import assert from 'node:assert/strict';
import {INGREDIENTS,emptyState,addGroceries,correctStock,physicalTotal,loadState} from '../public/phase0/domain.js';
import {ingredientIconMarkup} from '../public/phase0/ingredient-icons.js';
const now=Date.parse('2026-10-09T05:00:00Z');
test('pantry catalogue includes ten original piece-counted items plus unit-aware groceries',()=>{
 assert.ok(Object.keys(INGREDIENTS).length>=15);
 for(const x of Object.values(INGREDIENTS))assert.ok(x.en&&x.zh&&x.unit);
 for(const id of ['tomato','egg','carrot','potato','onion','garlic','mushroom','pumpkin','apple','orange'])assert.equal(INGREDIENTS[id].unit,'piece');
});
test('new groceries can be added and corrected without touching tomato or egg stock',()=>{
 let s=addGroceries(emptyState(),{ingredientId:'pumpkin',quantity:2,organicStatus:'organic'},now);
 s=addGroceries(s,{ingredientId:'apple',quantity:4,organicStatus:'nonorganic'},now);
 s=correctStock(s,{batchId:s.batches[0].id,onHand:1,reason:'count'},now);
 assert.equal(physicalTotal(s,'pumpkin'),1);assert.equal(physicalTotal(s,'apple'),4);
 assert.equal(physicalTotal(s,'tomato'),0);assert.equal(physicalTotal(s,'egg'),0);
 assert.equal(loadState(JSON.stringify(s),now).batches.length,2);
});
test('flat SVG grocery icons exist for new produce',()=>{
 for(const id of ['pumpkin','apple','orange'])assert.match(ingredientIconMarkup(id),/<svg/);
});
