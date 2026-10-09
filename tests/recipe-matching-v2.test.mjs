import test from 'node:test';import assert from 'node:assert/strict';
import {emptyState,addGroceries,physicalTotal} from '../public/phase0/domain.js';
import {RECIPES,recipeAvailability} from '../public/phase0/recipes.js';
import {recordedStock,recipeCheck,allocateRecipe} from '../public/phase0/recipe-matching.js';
import {buildDailyIdeas} from '../public/phase0/meal-planner.js';
const now=Date.parse('2026-10-09T05:00:00Z');
const get=id=>RECIPES.find(r=>r.id===id);
const add=(s,id,q,unit)=>addGroceries(s,{ingredientId:id,quantity:q,...(unit?{inputUnit:unit}:{})},now);
test('rice/chicken/mushroom quantities match using recorded base units',()=>{
 let s=emptyState();s=add(s,'rice',.5,'kg');s=add(s,'chicken',300,'g');s=add(s,'mushroom',5);
 const result=recipeAvailability(get('mushroom-rice'),s,now);
 assert.equal(result.ready,true);assert.deepEqual(result.missing,[]);
 assert.equal(physicalTotal(s,'rice'),500);
});
test('shortfalls and unknown recipe amounts are not called available',()=>{
 let s=emptyState();s=add(s,'rice',100,'g');s=add(s,'chicken',300,'g');
 const r=recipeAvailability(get('mushroom-rice'),s,now);
 assert.deepEqual(r.missing,['mushroom','rice']);
 const soup=recipeAvailability(get('pumpkin-soup'),add(s,'pumpkin',1),now);
 assert.deepEqual(soup.unknown,['water']);assert.equal(soup.ready,false);
});
test('expired batches are excluded from recipe matching',()=>{
 let s=addGroceries(emptyState(),{ingredientId:'egg',quantity:3,useBy:'2026-10-08'},now);
 assert.equal(recordedStock(s,now).egg,undefined);
 assert.deepEqual(recipeAvailability(get('egg-breakfast'),s,now).missing,['egg']);
});
test('allocation never consumes stock or double-counts tracked groceries',()=>{
 let s=emptyState();s=add(s,'tomato',2);s=add(s,'egg',3);
 const stock=recordedStock(s,now);
 assert.equal(allocateRecipe(get('tomato-egg'),stock),true);
 assert.equal(stock.tomato,0);assert.equal(stock.egg,0);
 assert.equal(allocateRecipe(get('tomato-egg'),stock),false);
 assert.equal(physicalTotal(s,'tomato'),2);assert.equal(physicalTotal(s,'egg'),3);
});
test('daily ideas remain distinct and physical inventory unchanged',()=>{
 let s=emptyState();s=add(s,'tomato',4);s=add(s,'egg',6);
 const p=buildDailyIdeas(s,{date:'2026-10-09'});
 const ids=Object.values(p.items).filter(Boolean).map(x=>x.recipe.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(physicalTotal(s,'egg'),6);
});
