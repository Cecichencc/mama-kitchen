// Three-meal idea planner: suggestions only, no reservations or stock deductions.
// All known tracked ingredients are allocated across meals before a plan is offered.
import {RECIPES} from './recipes.js';
import {recordedStock,recipeCheck,allocateRecipe} from './recipe-matching.js';
import {rankRecipeCandidates} from './recommendation-ranking.js';
export const MEALS=['breakfast','lunch','dinner'];
const dateSG=(now)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
export const stockForPlan=recordedStock;
export function buildDailyIdeas(state,{date=null,offsets={},previous=[],favorites=[],now=Date.now()}={}){
 const day=date||dateSG(now);
 const remaining=stockForPlan(state,now);
 const used=new Set(),usedCategories=new Set(),items={};
 for(const meal of MEALS){
  const choices=RECIPES.filter(r=>r.meal.includes(meal)&&!used.has(r.id))
   .map(recipe=>({recipe,...recipeCheck(recipe,remaining)}));
  const ranked=rankRecipeCandidates(choices,{previous,favorites,usedCategories:[...usedCategories]});
  // "Another Idea" must actually change recipes, including when there is only
  // one recorded-feasible dish. Less feasible alternatives stay clearly provisional.
  const rawOffset=Number(offsets[meal]);
  const index=(Number.isSafeInteger(rawOffset)&&rawOffset>=0?rawOffset:0)%Math.max(ranked.length,1);
  const selected=ranked[index]||null;
  items[meal]=selected?{...selected,provisional:selected.missing.length>0||selected.unknown.length>0,needsCheck:selected.unknown.length>0}:null;
  if(selected){
   used.add(selected.recipe.id);
   usedCategories.add(selected.recipe.category);
   if(!selected.missing.length)allocateRecipe(selected.recipe,remaining);
  }
 }
 return {date:day,items,remaining};
}
export function swapMeal(state,current,meal,previous=[]){
 if(!MEALS.includes(meal))throw Error('Unknown meal.');
 const offsets={...current.offsets,[meal]:(current.offsets?.[meal]||0)+1};
 return {...current,offsets,plan:buildDailyIdeas(state,{date:current.date,offsets,previous})};
}
