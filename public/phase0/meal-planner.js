// Three-meal idea planner: suggestions only, no reservations or stock deductions.
// All known tracked ingredients are allocated across meals before a plan is offered.
import {RECIPES,TRACKED_IDS} from './recipes.js';
export const MEALS=['breakfast','lunch','dinner'];
const dateSG=(now)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
export function stockForPlan(state,now=Date.now()){
 const counts={};
 for(const b of state.batches){
  if(!TRACKED_IDS.has(b.ingredientId)||b.onHand<=0)continue;
  if(b.useBy&&b.useBy<dateSG(now))continue;
  counts[b.ingredientId]=(counts[b.ingredientId]||0)+b.onHand;
 }
 return counts;
}
function assess(recipe,remaining){
 const missing=[],unknown=[];
 for(const [id,qty] of recipe.ingredients){
  if(!TRACKED_IDS.has(id)){unknown.push(id);continue;}
  if((remaining[id]||0)<qty)missing.push(id);
 }
 return {missing,unknown,verified:missing.length===0&&unknown.length===0};
}
function allocate(recipe,remaining){
 for(const [id,qty] of recipe.ingredients)if(TRACKED_IDS.has(id))remaining[id]-=qty;
}
export function buildDailyIdeas(state,{date=dateSG(Date.now()),offsets={},previous=[]}={}){
 const remaining=stockForPlan(state);
 const used=new Set(),items={};
 for(const meal of MEALS){
  const choices=RECIPES.filter(r=>r.meal.includes(meal)&&!used.has(r.id)).map(recipe=>({recipe,...assess(recipe,remaining)}));
  // Prefer tracked-feasible meals, fewer unknown ingredients, variety, and shorter preparation.
  choices.sort((a,b)=>Number(a.missing.length>0)-Number(b.missing.length>0)||
    a.missing.length-b.missing.length||a.unknown.length-b.unknown.length||
    Number(previous.includes(a.recipe.id))-Number(previous.includes(b.recipe.id))||
    a.recipe.minutes-b.recipe.minutes);
  const feasible=choices.filter(x=>!x.missing.length);
  const index=Math.abs(Number(offsets[meal])||0)%Math.max(feasible.length,1);
  const selected=feasible[index]||null;
  items[meal]=selected?{...selected,needsCheck:selected.unknown.length>0}:null;
  if(selected){used.add(selected.recipe.id);allocate(selected.recipe,remaining);}
 }
 return {date,items,remaining};
}
export function swapMeal(state,current,meal,previous=[]){
 if(!MEALS.includes(meal))throw Error('Unknown meal.');
 const offsets={...current.offsets,[meal]:(current.offsets?.[meal]||0)+1};
 return {...current,offsets,plan:buildDailyIdeas(state,{date:current.date,offsets,previous})};
}
