import test from 'node:test';
import assert from 'node:assert/strict';
import {INGREDIENTS,emptyState,addGroceries,physicalTotal} from '../public/phase0/domain.js';
import {RECIPES,recipeAvailability,formatRecipeQuantity} from '../public/phase0/recipes.js';
import {HOME_RECIPES} from '../public/phase0/home-recipes.js';
import {RECIPE_ART_IDS,recipeArtMarkup} from '../public/phase0/recipe-art.js';
import {buildDailyIdeas} from '../public/phase0/meal-planner.js';

const now=Date.parse('2026-10-09T05:00:00Z');
const get=id=>RECIPES.find(r=>r.id===id);
const add=(s,id,qty,unit)=>addGroceries(s,{
 ingredientId:id,quantity:qty,...(unit?{inputUnit:unit}:{}),organicStatus:'unknown'
},now);

test('eleven bilingual home-style dishes extend the curated catalogue without duplicate IDs',()=>{
 assert.equal(HOME_RECIPES.length,11);
 assert.equal(RECIPES.length,19);
 const ids=RECIPES.map(r=>r.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const r of RECIPES){
   assert.ok(r.en&&r.zh&&r.id&&r.minutes>0,r.id);
   assert.ok(Array.isArray(r.meal)&&r.meal.every(m=>['breakfast','lunch','dinner'].includes(m)),r.id);
   assert.ok(r.stepsEn?.length>=2&&r.stepsZh?.length>=2,r.id);
   for(const [id,qty] of r.ingredients){
     assert.equal(typeof id,'string');
     assert.ok(qty===null||(Number.isSafeInteger(qty)&&qty>0),r.id+': '+id);
     if(qty!=null)assert.ok(INGREDIENTS[id],r.id+': untracked quantity '+id);
   }
 }
});
test('all curated recipes have reusable inline SVG illustrations',()=>{
 for(const r of RECIPES){
   assert.ok(RECIPE_ART_IDS.includes(r.id),'Missing recipe SVG: '+r.id);
   const svg=recipeArtMarkup(r.id);
   assert.match(svg,/<svg[^>]*viewBox="0 0 320 240"/,r.id);
   assert.match(svg,/<\/svg>$/,r.id);
   assert.doesNotMatch(svg,/<img\b|https?:\/\//,r.id);
 }
});
test('new recipes match real measured base-unit stock without claiming condiments',()=>{
 let state=emptyState();
 state=add(state,'chicken',.35,'kg');
 state=add(state,'potato',2);
 state=add(state,'carrot',1);
 const stew=recipeAvailability(get('chicken-potato-stew'),state,now);
 assert.deepEqual(stew.missing,[]);
 assert.deepEqual(stew.unknown,['water']);
 assert.equal(stew.ready,false);
 assert.equal(physicalTotal(state,'chicken'),350);
});
test('fish soup reports missing fish and ginger as unverified separately',()=>{
 const state=add(emptyState(),'tomato',2);
 const result=recipeAvailability(get('tomato-fish-soup'),state,now);
 assert.deepEqual(result.missing,['fish']);
 assert.deepEqual(result.unknown,['water','ginger']);
});
test('recipe details display units rather than bare stock numbers',()=>{
 assert.equal(formatRecipeQuantity('rice',150),'150 g');
 assert.equal(formatRecipeQuantity('chicken',250,'zh-CN'),'250 克');
 assert.equal(formatRecipeQuantity('bokchoy',1,'en'),'1 bunch');
 assert.equal(formatRecipeQuantity('oil',10,'en'),'10 ml');
 assert.match(formatRecipeQuantity('flour',null,'en'),/check at home/);
});
test('three-meal suggestions avoid repeats and never deduct actual groceries',()=>{
 let state=emptyState();
 state=add(state,'egg',6);
 state=add(state,'rice',.4,'kg');
 state=add(state,'carrot',2);
 const snapshot=JSON.stringify(state);
 const plan=buildDailyIdeas(state,{date:'2026-10-09'});
 const ids=Object.values(plan.items).filter(Boolean).map(item=>item.recipe.id);
 assert.equal(ids.length,3);
 assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual(JSON.parse(JSON.stringify(state)),JSON.parse(snapshot));
 assert.ok(Object.values(plan.remaining).every(value=>value>=0));
});
