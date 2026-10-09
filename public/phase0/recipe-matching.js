// Shared deterministic recipe checks. Recorded stock only; no holds or deductions.
import {INGREDIENTS,isUsableBatch} from './domain.js';
export function recordedStock(state,now=Date.now()){
 const totals={};
 for(const b of state.batches||[]){
  if(!INGREDIENTS[b.ingredientId]||b.onHand<=0||!isUsableBatch(b,now))continue;
  totals[b.ingredientId]=(totals[b.ingredientId]||0)+b.onHand;
 }
 return totals;
}
export function recipeCheck(recipe,stock){
 const missing=[],unknown=[],sufficient=[];
 for(const [id,qty] of recipe.ingredients){
  // Null amounts cannot be evaluated even if some stock is recorded.
  if(!INGREDIENTS[id]||!Number.isSafeInteger(qty)||qty<=0){unknown.push(id);continue;}
  if((stock[id]||0)<qty)missing.push(id);
  else sufficient.push(id);
 }
 return {missing,unknown,sufficient,ready:missing.length===0&&unknown.length===0,
  provisional:missing.length>0||unknown.length>0};
}
export function allocateRecipe(recipe,remaining){
 for(const [id,qty] of recipe.ingredients){
  if(!INGREDIENTS[id]||!Number.isSafeInteger(qty)||qty<=0)continue;
  if((remaining[id]||0)<qty)return false;
 }
 for(const [id,qty] of recipe.ingredients){
  if(INGREDIENTS[id]&&Number.isSafeInteger(qty)&&qty>0)remaining[id]-=qty;
 }
 return true;
}
