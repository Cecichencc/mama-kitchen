import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {emptyState,addGroceries,physicalTotal} from '../public/phase0/domain.js';
import {RECIPES,rankedRecipes} from '../public/phase0/recipes.js';
import {rankRecipeCandidates} from '../public/phase0/recommendation-ranking.js';
import {buildDailyIdeas} from '../public/phase0/meal-planner.js';
import {
 sanitizeSuggestionState,beginSuggestionDay,rememberSuggestedPlan,
 recentSuggestedRecipeIds,SUGGESTION_HISTORY_DAYS
} from '../public/phase0/daily-suggestions.js';

const timestamp=Date.parse('2026-10-10T04:00:00Z');
const date='2026-10-10';
const item=(id,{missing=[],unknown=[],sufficient=[],category='soup',minutes=20}={})=>({
 recipe:{id,category,minutes},missing,unknown,sufficient
});
const add=(s,id,quantity,unit)=>addGroceries(s,{
 ingredientId:id,quantity,...(unit?{inputUnit:unit}:{})
},timestamp);

test('recorded ingredient fit comes before favourites or freshness',()=>{
 const ready=item('ready',{sufficient:['egg']});
 const uncertain=item('uncertain',{missing:['egg'],unknown:['oil']});
 const ranked=rankRecipeCandidates([uncertain,ready],{
  previous:['ready','ready','ready'],favorites:['uncertain']
 });
 assert.deepEqual(ranked.map(x=>x.recipe.id),['ready','uncertain']);
});

test('unknown-only dishes cannot outrank a dish with a quantified requirement',()=>{
 const unknownOnly=item('unknown-only',{unknown:['fish','vegetables','rice']});
 const measured=item('measured',{missing:['egg']});
 assert.equal(rankRecipeCandidates([unknownOnly,measured])[0].recipe.id,'measured');
});

test('recent recommendations rotate before favourites when ingredient fit ties',()=>{
 const a=item('a',{sufficient:['tomato'],unknown:['water']});
 const b=item('b',{sufficient:['tomato'],unknown:['water']});
 assert.deepEqual(rankRecipeCandidates([a,b],{previous:['a'],favorites:['a']})
  .map(x=>x.recipe.id),['b','a']);
 assert.deepEqual(rankRecipeCandidates([a,b],{favorites:['b']})
  .map(x=>x.recipe.id),['b','a']);
 assert.deepEqual(rankRecipeCandidates([a,b],{usedCategories:['soup']})
  .map(x=>x.recipe.id),['a','b']); // same category: deterministic tie
});

test('use a different dish category for dinner when match quality is equal',()=>{
 const soup=item('soup',{sufficient:['tomato'],unknown:['water']});
 const fry=item('fry',{sufficient:['tomato'],unknown:['oil'],category:'stir-fry'});
 assert.deepEqual(rankRecipeCandidates([soup,fry],{usedCategories:['soup']})
  .map(x=>x.recipe.id),['fry','soup']);
});

test('suggestion history records recommended, not cooked meals, once a day',()=>{
 const valid=RECIPES.map(x=>x.id);
 const raw={date:'2026-10-09',offsets:{breakfast:2,lunch:1},
  suggestions:{breakfast:'egg-breakfast',lunch:'tomato-egg',dinner:'tomato-soup'},
  history:[{date:'2026-10-08',ids:['tomato-soup']}]};
 const saved=sanitizeSuggestionState(raw,valid);
 const next=beginSuggestionDay(saved,date);
 assert.equal(next.date,date);
 assert.deepEqual(next.offsets,{});
 assert.deepEqual(next.history.map(x=>x.date),['2026-10-08','2026-10-09']);
 assert.deepEqual(recentSuggestedRecipeIds(next),
  ['tomato-soup','egg-breakfast','tomato-egg','tomato-soup']);
 assert.equal(beginSuggestionDay(next,date),next); // No duplicate day on re-render
 const plan={items:{
  breakfast:{recipe:{id:'egg-rice-porridge'}},
  lunch:{recipe:{id:'tomato-egg'}},
  dinner:{recipe:{id:'pumpkin-soup'}}
 }};
 const remembered=rememberSuggestedPlan(next,plan);
 assert.equal(remembered.suggestions.breakfast,'egg-rice-porridge');
 assert.deepEqual(next.suggestions,{});
 const later=beginSuggestionDay(remembered,'2026-10-18');
 assert.equal(later.history.length,0);
 assert.equal(SUGGESTION_HISTORY_DAYS,7);
});

test('invalid and legacy history entries are discarded safely',()=>{
 const valid=RECIPES.map(x=>x.id);
 const state=sanitizeSuggestionState({
  date:'2026-02-30',
  offsets:{breakfast:-9,lunch:'five',dinner:999999},
  suggestions:{breakfast:'non-existent',lunch:'tomato-egg'},
  history:['old-id',{date:'2026-10-09',ids:['tomato-egg','bogus','tomato-egg']}]
 },valid);
 assert.equal(state.date,'');
 assert.deepEqual(state.offsets,{breakfast:0,lunch:0,dinner:0});
 assert.deepEqual(state.suggestions,{lunch:'tomato-egg'});
 assert.deepEqual(state.history,[{date:'2026-10-09',ids:['tomato-egg']}]);
});

test('Another Idea changes lunch to a distinct recipe without stock deduction',()=>{
 let state=emptyState();
 state=add(state,'tomato',4);
 state=add(state,'potato',2);
 state=add(state,'egg',6);
 const before=JSON.stringify(state);
 const base=buildDailyIdeas(state,{date,now:timestamp});
 const swapped=buildDailyIdeas(state,{date,now:timestamp,offsets:{lunch:1}});
 assert.notEqual(base.items.lunch.recipe.id,swapped.items.lunch.recipe.id);
 assert.equal(JSON.stringify(state),before);
 assert.ok(Object.values(swapped.remaining).every(q=>q>=0));
});

test('similarly suitable lunch dishes rotate between days when Pantry supports both',()=>{
 let state=emptyState();
 for(const [id,n] of [['egg',6],['tomato',2],['potato',2],['mushroom',4]])
  state=add(state,id,n);
 const first=buildDailyIdeas(state,{date,now:timestamp});
 const second=buildDailyIdeas(state,{
  date:'2026-10-11',now:timestamp+86400000,
  previous:[first.items.lunch.recipe.id]
 });
 assert.notEqual(first.items.lunch.recipe.id,second.items.lunch.recipe.id);
 assert.equal(physicalTotal(state,'egg'),6);
});

test('recipe library uses same stock ranking and respects favourites on ties',()=>{
 let state=emptyState();state=add(state,'egg',2);
 const items=rankedRecipes(state,'breakfast',{previous:[],favorites:['egg-breakfast']});
 assert.equal(items[0].recipe.id,'egg-breakfast');
 assert.equal(state.batches[0].onHand,2);
});

test('UI persists only local suggestion IDs and offers recipe swaps in both languages',()=>{
 const ui=readFileSync(new URL('../public/phase0/recipe-discovery.js',import.meta.url),'utf8');
 assert.match(ui,/recentSuggestedRecipeIds\(daily\)/);
 assert.match(ui,/rememberSuggestedPlan\(daily,plan\)/);
 assert.match(ui,/data-swap-meal/);
 assert.match(ui,/Suggestions, not a cooking log/);
 assert.match(ui,/这里只记录推荐/);
});
