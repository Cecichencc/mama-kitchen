import test from 'node:test';import assert from 'node:assert/strict';
import {emptyState,addGroceries,physicalTotal} from '../public/phase0/domain.js';
import {buildDailyIdeas,stockForPlan} from '../public/phase0/meal-planner.js';
const now=Date.parse('2026-10-09T04:00:00Z');
const date='2026-10-09';
function stock(tomatoes,eggs){let s=emptyState();if(tomatoes)s=addGroceries(s,{ingredientId:'tomato',quantity:tomatoes},now);if(eggs)s=addGroceries(s,{ingredientId:'egg',quantity:eggs},now);return s;}
test('three slots show distinct suggestions when sufficient recorded ingredients',()=>{
 const s=stock(6,8),p=buildDailyIdeas(s,{date});
 const ids=Object.values(p.items).filter(Boolean).map(x=>x.recipe.id);
 assert.equal(ids.length,3);assert.equal(new Set(ids).size,3);
 assert.equal(physicalTotal(s,'tomato'),6);assert.equal(physicalTotal(s,'egg'),8);
});
test('tracked stock is allocated across three meals without double counting',()=>{
 const s=stock(2,2),p=buildDailyIdeas(s,{date});
 assert.ok(Object.values(p.remaining).every(n=>n>=0));
 const usage={tomato:0,egg:0};
 for(const item of Object.values(p.items))if(item&&!item.missing.length)for(const [id,q] of item.recipe.ingredients)if(id in usage)usage[id]+=q;
 assert.ok(usage.tomato<=2);assert.ok(usage.egg<=2);
});
test('untracked groceries are flagged as unknown rather than verified available',()=>{
 const p=buildDailyIdeas(stock(0,0),{date});
 for(const item of Object.values(p.items))if(item){assert.equal(item.ready,false);assert.equal(item.provisional,true);}
});
test('individual swap preserves physical stock and keeps unique dishes',()=>{
 const s=stock(6,8),p=buildDailyIdeas(s,{date,offsets:{lunch:1}});
 const ids=Object.values(p.items).filter(Boolean).map(x=>x.recipe.id);
 assert.equal(new Set(ids).size,ids.length);assert.equal(physicalTotal(s,'egg'),8);
});
test('past-use-by stock excluded from planning',()=>{
 let s=addGroceries(emptyState(),{ingredientId:'egg',quantity:4,useBy:'2026-10-08'},now);
 assert.equal(stockForPlan(s,now).egg,undefined);
});

test('empty breakfast stock still produces a clearly provisional suggestion',()=>{
 const p=buildDailyIdeas(stock(0,0),{date});
 assert.ok(p.items.breakfast);
 assert.equal(p.items.breakfast.provisional,true);
 assert.ok(p.items.breakfast.missing.includes('egg'));
 assert.equal(p.remaining.egg||0,0);
});
test('provisional meal ideas do not allocate imaginary stock',()=>{
 const p=buildDailyIdeas(stock(0,0),{date});
 assert.ok(Object.values(p.remaining).every(n=>n>=0));
 assert.ok(Object.values(p.items).every(x=>!x||x.provisional));
});
