import test from 'node:test';import assert from 'node:assert/strict';
import {toBase,displayAmount,unitOptions} from '../public/phase0/units.js';
import {INGREDIENTS,emptyState,addGroceries,correctStock,loadState,physicalTotal} from '../public/phase0/domain.js';
const now=Date.parse('2026-10-09T05:00:00Z');
test('grams/kg and ml/l convert to integer base quantities',()=>{
 assert.equal(toBase(1.5,'kg','g'),1500);
 assert.equal(toBase(.75,'l','ml'),750);
 assert.equal(displayAmount(1500,'g'),'1.5 kg');
 assert.equal(displayAmount(750,'ml','zh-CN'),'750 毫升');
});
test('no conversion of bunch/pack to grams; reject fractional pieces',()=>{
 assert.throws(()=>toBase(2,'kg','bunch'),/Invalid/);
 assert.throws(()=>toBase(1.5,'piece','piece'),/whole base/);
 assert.equal(unitOptions('bunch')[0].id,'bunch');
});
test('unit-aware Pantry keeps batch stock and movement history consistent',()=>{
 let s=addGroceries(emptyState(),{ingredientId:'rice',quantity:1.5,inputUnit:'kg',organicStatus:'organic'},now);
 s=addGroceries(s,{ingredientId:'oil',quantity:.75,inputUnit:'l'},now);
 assert.equal(physicalTotal(s,'rice'),1500);
 assert.equal(s.batches[0].unit,'g');
 assert.equal(s.batches[1].onHand,750);
 s=correctStock(s,{batchId:s.batches[0].id,onHand:1200},now);
 assert.equal(loadState(JSON.stringify(s),now).batches[0].onHand,1200);
 assert.equal(s.movements.at(-1).delta,-300);
});
test('legacy piece-based stock still loads without migration',()=>{
 let s=addGroceries(emptyState(),{ingredientId:'tomato',quantity:6},now);
 assert.equal(loadState(JSON.stringify(s),now).batches[0].unit,'piece');
 assert.equal(INGREDIENTS.tomato.unit,'piece');
});
