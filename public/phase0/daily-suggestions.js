// Local-only history of RECENT SUGGESTIONS, not meals cooked or reserved.
// Only the final three suggestions for a day are carried into the next day.
export const SUGGESTION_HISTORY_DAYS=7;
const MEAL_NAMES=['breakfast','lunch','dinner'];
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&
 !Number.isNaN(Date.parse(value+'T00:00:00Z'))&&
 new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const ageInDays=(older,newer)=>(Date.parse(newer+'T00:00:00Z')-Date.parse(older+'T00:00:00Z'))/86400000;
export function sanitizeSuggestionState(raw,validRecipeIds){
 const known=new Set(validRecipeIds);
 const value=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const date=validDate(value.date)?value.date:'';
 const offsets={};
 for(const meal of MEAL_NAMES){
  const n=value.offsets?.[meal];
  offsets[meal]=Number.isSafeInteger(n)&&n>=0&&n<=10000?n:0;
 }
 const suggestions={};
 for(const meal of MEAL_NAMES){
  const id=value.suggestions?.[meal];
  if(typeof id==='string'&&known.has(id))suggestions[meal]=id;
 }
 const history=Array.isArray(value.history)?value.history.filter(r=>
   r&&validDate(r.date)&&Array.isArray(r.ids)
  ).map(r=>({
   date:r.date,
   ids:[...new Set(r.ids.filter(id=>typeof id==='string'&&known.has(id)))].slice(0,3)
  })).filter(r=>r.ids.length>0).slice(-SUGGESTION_HISTORY_DAYS):[];
 return {date,offsets,suggestions,history};
}
export function beginSuggestionDay(saved,today){
 if(!validDate(today))throw Error('Invalid suggestion day');
 if(saved.date===today)return saved;
 let history=saved.history.filter(r=>ageInDays(r.date,today)>0&&ageInDays(r.date,today)<=SUGGESTION_HISTORY_DAYS);
 if(validDate(saved.date)){
  const age=ageInDays(saved.date,today);
  if(age>0&&age<=SUGGESTION_HISTORY_DAYS){
   const ids=[...new Set(MEAL_NAMES.map(meal=>saved.suggestions[meal]).filter(Boolean))];
   if(ids.length)history.push({date:saved.date,ids});
  }
 }
 // Only one entry for each day; sanitization protects against repeated reloads.
 const uniqueDays=new Map();
 for(const entry of history)uniqueDays.set(entry.date,entry);
 history=[...uniqueDays.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-SUGGESTION_HISTORY_DAYS);
 return {date:today,offsets:{},suggestions:{},history};
}
export function rememberSuggestedPlan(saved,plan){
 const suggestions={};
 for(const meal of MEAL_NAMES){
  const id=plan.items?.[meal]?.recipe?.id;
  if(typeof id==='string')suggestions[meal]=id;
 }
 return {...saved,suggestions};
}
export function recentSuggestedRecipeIds(saved){
 return saved.history.flatMap(record=>record.ids);
}
