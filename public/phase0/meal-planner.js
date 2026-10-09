// Three-meal idea planner: suggestions only, no reservations or stock deductions.
// All known tracked ingredients are allocated across meals before a plan is offered.
import {RECIPES} from './recipes.js';
import {recordedStock,recipeCheck,allocateRecipe} from './recipe-matching.js';
export const MEALS=['breakfast','lunch','dinner'];
const dateSG=(now)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
export const stockForPlan=recordedStock;
export function buildDailyIdeas(state,{date=dateSG(Date.now()),offsets={},previous=[]}={}){
 const remaining=stockForPlan(state);
 const used=new Set(),items={};
 for(const meal of MEALS){
  const choices=RECIPES.filter(r=>r.meal.includes(meal)&&!used.has(r.id)).map(recipe=>({recipe,...recipeCheck(recipe,remaining)}));
  // Prefer tracked-feasible meals, fewer unknown ingredients, variety, and shorter preparation.
  choices.sort((a,b)=>Number(a.missing.length>0)-Number(b.missing.length>0)||
    a.missing.length-b.missing.length||a.unknown.length-b.unknown.length||
    Number(previous.includes(a.recipe.id))-Number(previous.includes(b.recipe.id))||
    a.recipe.minutes-b.recipe.minutes);
  const feasible=choices.filter(x=>!x.missing.length);
  const candidates=feasible.length?feasible:choices;
  const index=Math.abs(Number(offsets[meal])||0)%Math.max(candidates.length,1);
  const selected=candidates[index]||null;
  items[meal]=selected?{...selected,provisional:selected.missing.length>0||selected.unknown.length>0,needsCheck:selected.unknown.length>0}:null;
  if(selected){used.add(selected.recipe.id);if(!selected.missing.length)allocateRecipe(selected.recipe,remaining);}
 }
 return {date,items,remaining};
}
export function swapMeal(state,current,meal,previous=[]){
 if(!MEALS.includes(meal))throw Error('Unknown meal.');
 const offsets={...current.offsets,[meal]:(current.offsets?.[meal]||0)+1};
 return {...current,offsets,plan:buildDailyIdeas(state,{date:current.date,offsets,previous})};
}
