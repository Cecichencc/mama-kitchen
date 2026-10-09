import test from 'node:test';
import assert from 'node:assert/strict';
import {
 emptyShoppingList,sanitizeShoppingList,addRecipeToShopping,
 removeRecipeFromShopping,clearShoppingList,setShoppingChecked,
 calculateShoppingNeeds,SHOPPING_STORAGE_KEY
} from '../public/phase0/shopping-list.js';
import {RECIPES} from '../public/phase0/recipes.js';
import {emptyState,addGroceries,physicalTotal} from '../public/phase0/domain.js';
const now=Date.parse('2026-10-10T08:00:00Z');
const add=(s,id,quantity,inputUnit,useBy)=>addGroceries(s,{
 ingredientId:id,quantity,...(inputUnit?{inputUnit}:{}),...(useBy?{useBy}:{})
},now);
const chosen=(...ids)=>ids.reduce((state,id)=>addRecipeToShopping(state,id,RECIPES),emptyShoppingList());

test('two recipes combine eggs once and subtract usable stock once',()=>{
 let groceries=emptyState();
 groceries=add(groceries,'egg',3);
 const shopping=chosen('egg-breakfast','steamed-egg');
 const list=calculateShoppingNeeds(shopping,RECIPES,groceries,now);
 assert.equal(list.toBuy.length,1);
 assert.deepEqual(list.toBuy[0],{
  ingredientId:'egg',required:4,recorded:3,quantity:1,unit:'piece',checked:false
 });
 assert.equal(list.recipes.length,2);
 assert.equal(physicalTotal(groceries,'egg'),3);
});
test('kg and grams use the same dry-rice base unit',()=>{
 let groceries=emptyState();
 groceries=add(groceries,'rice',.2,'kg');
 const shopping=chosen('egg-rice-porridge','chicken-carrot-rice');
 const list=calculateShoppingNeeds(shopping,RECIPES,groceries,now);
 assert.deepEqual(list.toBuy.find(x=>x.ingredientId==='rice'),{
  ingredientId:'rice',required:250,recorded:200,quantity:50,unit:'g',checked:false
 });
 assert.ok(list.toBuy.find(x=>x.ingredientId==='chicken'));
 assert.equal(physicalTotal(groceries,'rice'),200);
});
test('expired stock cannot satisfy a shopping requirement',()=>{
 const s=add(emptyState(),'egg',12,null,'2026-10-09');
 const x=calculateShoppingNeeds(chosen('egg-breakfast'),RECIPES,s,now);
 assert.equal(x.toBuy[0].quantity,2);
 assert.equal(x.toBuy[0].recorded,0);
 assert.equal(physicalTotal(s,'egg'),12);
});
test('unknown/unquantified staples are CHECK AT HOME, never calculated purchases',()=>{
 const x=calculateShoppingNeeds(chosen('tomato-egg','carrot-egg-pancakes'),RECIPES,emptyState(),now);
 const uncertain=x.toCheck.map(e=>e.ingredientId);
 for(const id of ['salt','oil','flour'])assert.ok(uncertain.includes(id),id);
 assert.ok(!x.toBuy.some(x=>uncertain.includes(x.ingredientId)&&x.ingredientId==='salt'));
 assert.ok(!x.toBuy.some(x=>x.ingredientId==='flour'));
 const oil=x.toCheck.find(e=>e.ingredientId==='oil');
 assert.deepEqual(oil.recipeIds,['tomato-egg','carrot-egg-pancakes']);
});
test('sufficient recorded groceries do not appear as missing',()=>{
 let state=emptyState();
 state=add(state,'egg',5);
 state=add(state,'tomato',2);
 const x=calculateShoppingNeeds(chosen('tomato-egg'),RECIPES,state,now);
 assert.equal(x.toBuy.length,0);
 assert.equal(x.covered.length,2);
 assert.deepEqual(x.toCheck.map(v=>v.ingredientId),['oil','salt']);
});
test('shopping checklist is device-local and does not change batches or reserve anything',()=>{
 const state=add(emptyState(),'egg',1);
 const snapshot=JSON.stringify(state);
 let shopping=chosen('egg-breakfast');
 shopping=setShoppingChecked(shopping,'egg',1,true,RECIPES);
 let x=calculateShoppingNeeds(shopping,RECIPES,state,now);
 assert.equal(x.checkedItems,1);
 assert.equal(x.toBuy[0].checked,true);
 shopping=setShoppingChecked(shopping,'egg',1,false,RECIPES);
 x=calculateShoppingNeeds(shopping,RECIPES,state,now);
 assert.equal(x.checkedItems,0);
 assert.equal(JSON.stringify(state),snapshot);
 assert.equal(SHOPPING_STORAGE_KEY,'kitchen-garden.shopping.v1');
});
test('changed required quantity makes old checkbox unselected',()=>{
 let shopping=chosen('egg-breakfast');
 shopping=setShoppingChecked(shopping,'egg',2,true,RECIPES);
 const first=calculateShoppingNeeds(shopping,RECIPES,emptyState(),now);
 assert.equal(first.toBuy[0].checked,true);
 const after=calculateShoppingNeeds(shopping,RECIPES,add(emptyState(),'egg',1),now);
 assert.equal(after.toBuy[0].quantity,1);
 assert.equal(after.toBuy[0].checked,false);
});
test('removing a recipe recomputes aggregated needs and resets checked marks',()=>{
 let shopping=chosen('egg-breakfast','steamed-egg');
 shopping=setShoppingChecked(shopping,'egg',4,true,RECIPES);
 const x=calculateShoppingNeeds(shopping,RECIPES,emptyState(),now);
 assert.equal(x.toBuy[0].quantity,4);
 shopping=removeRecipeFromShopping(shopping,'steamed-egg',RECIPES);
 assert.equal(calculateShoppingNeeds(shopping,RECIPES,emptyState(),now).toBuy[0].quantity,2);
 assert.equal(Object.keys(shopping.checked).length,0);
 assert.deepEqual(clearShoppingList(),emptyShoppingList());
});
test('corrupt storage, duplicate IDs and oversized recipes are sanitized',()=>{
 const state=sanitizeShoppingList({
  recipeIds:['egg-breakfast','egg-breakfast','no-such-recipe','tomato-egg'],
  checked:{egg:3,garlic:-1,tomato:'7',unknown:42}
 },RECIPES);
 assert.deepEqual(state.recipeIds,['egg-breakfast','tomato-egg']);
 assert.deepEqual(state.checked,{egg:3});
 assert.deepEqual(sanitizeShoppingList(null,RECIPES),emptyShoppingList());
 assert.throws(()=>addRecipeToShopping(state,'non-existent',RECIPES),/Unknown recipe/);
});
