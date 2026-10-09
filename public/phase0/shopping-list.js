// Kitchen Garden Shopping List v1: device-local PLANS only, never physical stock.
// Quantified shortages are calculated from actual, non-expired batches. Ingredients
// with unknown requirements are labelled "check at home", NOT "need to buy".
import {INGREDIENTS} from './domain.js';
import {recordedStock} from './recipe-matching.js';

export const SHOPPING_STORAGE_KEY='kitchen-garden.shopping.v1';
export const SHOPPING_SCHEMA=1;
export const MAX_SHOPPING_RECIPES=30;
const validAmount=n=>Number.isSafeInteger(n)&&n>0&&n<=99999;

export function emptyShoppingList(){
 return {schema:SHOPPING_SCHEMA,recipeIds:[],checked:{}};
}
export function sanitizeShoppingList(raw,recipes){
 const allowed=new Set(recipes.map(recipe=>recipe.id));
 const input=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const recipeIds=[];
 for(const id of Array.isArray(input.recipeIds)?input.recipeIds:[]){
  if(typeof id==='string'&&allowed.has(id)&&!recipeIds.includes(id)&&recipeIds.length<MAX_SHOPPING_RECIPES)
   recipeIds.push(id);
 }
 const checked={};
 if(input.checked&&typeof input.checked==='object'&&!Array.isArray(input.checked)){
  for(const [id,qty] of Object.entries(input.checked)){
   if(Object.hasOwn(INGREDIENTS,id)&&validAmount(qty))checked[id]=qty;
  }
 }
 return {schema:SHOPPING_SCHEMA,recipeIds,checked};
}
export function addRecipeToShopping(shopping,recipeId,recipes){
 const next=sanitizeShoppingList(shopping,recipes);
 if(!recipes.some(r=>r.id===recipeId))throw Error('Unknown recipe');
 if(next.recipeIds.includes(recipeId))return next;
 if(next.recipeIds.length>=MAX_SHOPPING_RECIPES)throw Error('Shopping list recipe limit reached');
 return {...next,recipeIds:[...next.recipeIds,recipeId]};
}
export function removeRecipeFromShopping(shopping,recipeId,recipes){
 const next=sanitizeShoppingList(shopping,recipes);
 return {...next,recipeIds:next.recipeIds.filter(id=>id!==recipeId),checked:{}};
}
export function clearShoppingList(){return emptyShoppingList();}
export function setShoppingChecked(shopping,id,needed,checked,recipes){
 if(!Object.hasOwn(INGREDIENTS,id)||!validAmount(needed))throw Error('Invalid shopping item');
 const next=sanitizeShoppingList(shopping,recipes);
 const marks={...next.checked};
 if(checked)marks[id]=needed;else delete marks[id];
 return {...next,checked:marks};
}
export function isShoppingChecked(shopping,id,needed){
 return validAmount(needed)&&shopping.checked?.[id]===needed;
}
export function calculateShoppingNeeds(shopping,recipes,state,now=Date.now()){
 const list=sanitizeShoppingList(shopping,recipes);
 const byRecipe=new Map(recipes.map(recipe=>[recipe.id,recipe]));
 const stock=recordedStock(state,now);
 const total=new Map(),verify=new Map();
 for(const recipeId of list.recipeIds){
  const recipe=byRecipe.get(recipeId);
  if(!recipe)continue;
  for(const [id,amount] of recipe.ingredients){
   const known=INGREDIENTS[id];
   if(!known||!validAmount(amount)){
    if(!verify.has(id))verify.set(id,{ingredientId:id,recipeIds:[],reason:!known?'untracked':'unquantified'});
    const entry=verify.get(id);
    if(!entry.recipeIds.includes(recipeId))entry.recipeIds.push(recipeId);
    continue;
   }
   const current=total.get(id)||0;
   if(current+amount>99999)throw Error('Shopping quantities exceed supported maximum');
   total.set(id,current+amount);
  }
 }
 const toBuy=[],covered=[];
 for(const [id,required] of total){
  const recorded=stock[id]||0;
  const need=Math.max(0,required-recorded);
  const entry={
   ingredientId:id,required,recorded,quantity:need,unit:INGREDIENTS[id].unit
  };
  if(need>0)toBuy.push({...entry,checked:isShoppingChecked(list,id,need)});
  else covered.push(entry);
 }
 return {
  recipes:list.recipeIds.map(id=>byRecipe.get(id)).filter(Boolean),
  toBuy,covered,toCheck:[...verify.values()],
  // A checked shopping line is a manual checklist mark, NOT proof of purchase.
  totalItems:toBuy.length,
  checkedItems:toBuy.filter(x=>x.checked).length
 };
}
