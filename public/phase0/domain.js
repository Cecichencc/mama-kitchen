// Kitchen Garden Phase 1 — device-local, deterministic inventory domain.
// This module has NO DOM, WebGL or browser-storage dependency.
// Physical stock is authoritative; harvesting only creates a reservation.
// Phase 2 must replace this local adapter with transactional household storage.
export const RESERVATION_MS = 30 * 60 * 1000;
export const STORAGE_KEY = 'kitchen-garden.phase1.v1';
export const INGREDIENTS = Object.freeze({
  tomato: Object.freeze({id:'tomato',en:'Tomato',zh:'番茄',unit:'piece',zone:'vegetable'}),
  egg: Object.freeze({id:'egg',en:'Egg',zh:'鸡蛋',unit:'piece',zone:'barn'}),
  carrot: Object.freeze({id:'carrot',en:'Carrot',zh:'胡萝卜',unit:'piece',zone:'vegetable'}),
  potato: Object.freeze({id:'potato',en:'Potato',zh:'土豆',unit:'piece',zone:'grain'}),
  onion: Object.freeze({id:'onion',en:'Onion',zh:'洋葱',unit:'piece',zone:'vegetable'}),
  garlic: Object.freeze({id:'garlic',en:'Garlic (bulb)',zh:'大蒜（头）',unit:'piece',zone:'vegetable'}),
  mushroom: Object.freeze({id:'mushroom',en:'Mushroom',zh:'蘑菇',unit:'piece',zone:'vegetable'}),
  pumpkin: Object.freeze({id:'pumpkin',en:'Pumpkin',zh:'南瓜',unit:'piece',zone:'vegetable'}),
  apple: Object.freeze({id:'apple',en:'Apple',zh:'苹果',unit:'piece',zone:'fruit'}),
  orange: Object.freeze({id:'orange',en:'Orange',zh:'橙子',unit:'piece',zone:'fruit'})
});
export const RECIPE = Object.freeze({
  id:'tomato-egg',nameEn:'Tomato & Egg Stir-fry',nameZh:'番茄炒蛋',servings:2,cookMinutes:15,
  ingredients:Object.freeze([{ingredientId:'tomato',quantity:2},{ingredientId:'egg',quantity:3}]),
  stepsEn:Object.freeze(['Wash and cut the tomatoes.','Beat the eggs. Cook them gently until just set, then transfer.','Cook the tomatoes until softened; return eggs and stir together.','Serve with a separate grain and vegetable side if available.']),
  stepsZh:Object.freeze(['洗净番茄并切块。','打散鸡蛋，小火炒至刚凝固后盛出。','把番茄炒软，放回鸡蛋翻匀。','可按家中实际食材另配主食和蔬菜。'])
});
export const SOURCES = Object.freeze(['organic','nonorganic','unknown']);
export const STORAGES = Object.freeze(['fridge','freezer','pantry']);
const BATCH_PREFIX='kg-b';
const safeInt = (value,label,{minimum=0,maximum=99999}={}) => {
  if(typeof value!=='number'||!Number.isSafeInteger(value)||value<minimum||value>maximum){
    throw new Error(`${label} must be a whole number between ${minimum} and ${maximum}.`);
  }
  return value;
};
const checkIngredient = id => {if(!INGREDIENTS[id])throw new Error('Unknown ingredient.');};
const checkSource = x => {if(!SOURCES.includes(x))throw new Error('Choose a valid ingredient source.');};
const checkStorage = x => {if(!STORAGES.includes(x))throw new Error('Choose a valid storage location.');};
const validDate = x => x==='' || x==null || /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x+'T00:00:00Z')) && new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
function todaySingapore(now) {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));
  const get=k=>parts.find(p=>p.type===k)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
const clone = state => JSON.parse(JSON.stringify(state));
export function emptyState(){return {schema:1,sequence:1,batches:[],basket:{lines:[],expiresAt:null},sessions:[],movements:[]};}
function batchFor(state,id){const batch=state.batches.find(b=>b.id===id);if(!batch)throw new Error('The ingredient batch was not found.');return batch;}
function quantityHeld(state,batchId){return state.basket.lines.filter(line=>line.batchId===batchId).reduce((n,line)=>n+line.quantity,0);}
export function heldQuantity(state,batchId){return quantityHeld(state,batchId);}
export function availableQuantity(state,batchId,now=Date.now()){
  const batch=batchFor(state,batchId);
  if(!isUsableBatch(batch,now))return 0;
  return Math.max(0,batch.onHand-quantityHeld(state,batchId));
}
export function isUsableBatch(batch,now=Date.now()) {return !batch.useBy || todaySingapore(now)<=batch.useBy;}
export function physicalTotal(state,ingredientId){checkIngredient(ingredientId);return state.batches.filter(b=>b.ingredientId===ingredientId).reduce((n,b)=>n+b.onHand,0);}
export function usableTotal(state,ingredientId,now=Date.now()){
  checkIngredient(ingredientId);
  return state.batches.filter(b=>b.ingredientId===ingredientId).reduce((n,b)=>n+availableQuantity(state,b.id,now),0);
}
export function basketQuantity(state,ingredientId){checkIngredient(ingredientId);return state.basket.lines.reduce((n,line)=>n+(batchFor(state,line.batchId).ingredientId===ingredientId?line.quantity:0),0);}
export function hasMixedSource(state,lines=state.basket.lines){return lines.some(line=>line.quantity>0&&batchFor(state,line.batchId).organicStatus!=='organic');}
function record(next,batchId,delta,type,now){next.movements.push({id:`kg-m${next.sequence++}`,batchId,delta,type,createdAt:new Date(now).toISOString()});}
export function expireBasket(state,now=Date.now()) {
  if(!state.basket.expiresAt || now < state.basket.expiresAt)return state;
  const next=clone(state);next.basket={lines:[],expiresAt:null};return next;
}
export function checkState(state){
  if(!state ||state.schema!==1||!Array.isArray(state.batches)||!state.basket||!Array.isArray(state.basket.lines)||!Array.isArray(state.sessions)||!Array.isArray(state.movements)||!Number.isSafeInteger(state.sequence))throw new Error('Unsupported or damaged inventory data.');
  const seen=new Set();
  for(const b of state.batches){
    if(typeof b.id!=='string'||seen.has(b.id))throw new Error('Invalid batch ID.');seen.add(b.id);
    checkIngredient(b.ingredientId);checkSource(b.organicStatus);checkStorage(b.storage);
    safeInt(b.onHand,'Physical quantity');if(!validDate(b.useBy))throw new Error('Invalid use-by date.');
  }
  for(const line of state.basket.lines){
    if(!Number.isSafeInteger(line.quantity)||line.quantity<=0)throw new Error('Invalid held quantity.');
    const b=batchFor(state,line.batchId);
    if(quantityHeld(state,b.id)>b.onHand)throw new Error('Reservations exceed physical stock.');
  }
  if(state.basket.lines.length && (!Number.isFinite(state.basket.expiresAt)||state.basket.expiresAt<=0))throw new Error('Reservation expiration is missing.');
  return true;
}
export function loadState(raw,now=Date.now()){
  if(!raw)return emptyState();
  const parsed=typeof raw==='string'?JSON.parse(raw):raw;
  checkState(parsed);return expireBasket(parsed,now);
}
export function addGroceries(state,{ingredientId,quantity,organicStatus='unknown',storage='fridge',useBy=''},now=Date.now()){
  checkState(state);checkIngredient(ingredientId);checkSource(organicStatus);checkStorage(storage);
  safeInt(quantity,'Quantity',{minimum:1,maximum:9999});if(!validDate(useBy))throw new Error('Use YYYY-MM-DD for the use-by date.');
  const next=clone(expireBasket(state,now));
  const id=`${BATCH_PREFIX}${next.sequence++}`;
  next.batches.push({id,ingredientId,onHand:quantity,unit:'piece',organicStatus,storage,useBy:useBy||null,createdAt:new Date(now).toISOString()});
  record(next,id,quantity,'add',now);checkState(next);return next;
}
export function correctStock(state,{batchId,onHand,reason='count'},now=Date.now()){
  checkState(state);safeInt(onHand,'Corrected stock',{maximum:99999});
  if(!['count','used-outside','discarded'].includes(reason))throw new Error('Choose a correction reason.');
  const next=clone(expireBasket(state,now)),b=batchFor(next,batchId);
  if(onHand < quantityHeld(next,batchId))throw new Error('Release reserved ingredients before reducing this stock.');
  const delta=onHand-b.onHand;if(delta===0)return state;
  b.onHand=onHand;record(next,batchId,delta,reason,now);checkState(next);return next;
}
export function setReservation(state,{batchId,quantity},now=Date.now()){
  checkState(state);safeInt(quantity,'Reserved quantity',{maximum:9999});
  const next=clone(expireBasket(state,now)),batch=batchFor(next,batchId);
  if(quantity>0 && !isUsableBatch(batch,now))throw new Error('This batch is past its use-by date and cannot be harvested.');
  const other=next.basket.lines.filter(line=>line.batchId!==batchId);
  if(quantity>batch.onHand)throw new Error('Not enough usable stock for that quantity.');
  next.basket.lines=quantity? [...other,{batchId,quantity}]:other;
  if(next.basket.lines.length)next.basket.expiresAt=now+RESERVATION_MS;
  else next.basket.expiresAt=null;
  checkState(next);return next;
}
export function reserve(state,{batchId,quantity},now=Date.now()) {
  safeInt(quantity,'Harvest quantity',{minimum:1,maximum:9999});
  const expired=expireBasket(state,now);
  return setReservation(expired,{batchId,quantity:quantityHeld(expired,batchId)+quantity},now);
}
export function clearBasket(state,now=Date.now()){
  const next=clone(expireBasket(state,now));next.basket={lines:[],expiresAt:null};return next;
}
export function recipeReadiness(state){return {
  possible:basketQuantity(state,'tomato')>=2&&basketQuantity(state,'egg')>=3,
  recommended:basketQuantity(state,'tomato')>=2&&basketQuantity(state,'egg')>=3,
  tomato:basketQuantity(state,'tomato'),egg:basketQuantity(state,'egg')
};}
export function confirmCooked(state,{key,actualLines,ackMixed=false},now=Date.now()){
  checkState(state);
  if(typeof key!=='string'||!key.trim()||key.length>128)throw new Error('A unique cooking confirmation key is required.');
  // Idempotent replay: unchanged stock even when called again after basket is cleared.
  if(state.sessions.some(s=>s.key===key))return state;
  const next=clone(expireBasket(state,now));
  if(!next.basket.lines.length)throw new Error('Harvest ingredients before cooking.');
  if(!Array.isArray(actualLines))throw new Error('Actual amounts are required.');
  const byId=new Map();
  for(const line of actualLines){
    if(byId.has(line.batchId))throw new Error('Duplicate ingredient batch in cooking confirmation.');
    safeInt(line.quantity,'Actual quantity',{maximum:9999});
    if(!next.basket.lines.some(hold=>hold.batchId===line.batchId))throw new Error('Only ingredients in this basket may be cooked.');
    byId.set(line.batchId,line.quantity);
  }
  for(const line of next.basket.lines)if(!byId.has(line.batchId))throw new Error('Review the amount used for every basket item.');
  const totals={tomato:0,egg:0};
  for(const [id,qty] of byId){
    const batch=batchFor(next,id);
    if(qty>0 && !isUsableBatch(batch,now))throw new Error('A selected ingredient is past its use-by date.');
    if(qty>batch.onHand)throw new Error('Not enough physical stock for the actual cooking amounts.');
    totals[batch.ingredientId]+=qty;
  }
  if(totals.tomato<1 || totals.egg<1)throw new Error('Tomato and egg are both required for this recipe.');
  const lines=[...byId.entries()].filter(([,qty])=>qty>0).map(([batchId,quantity])=>({batchId,quantity}));
  const mixed=hasMixedSource(next,lines);
  if(mixed&&!ackMixed)throw new Error('Confirm the mixed or non-organic ingredients for the shared dish.');
  for(const line of lines){const batch=batchFor(next,line.batchId);batch.onHand-=line.quantity;record(next,line.batchId,-line.quantity,'cooked',now);}
  const session={id:`kg-s${next.sequence++}`,key,recipeId:RECIPE.id,ingredients:lines,servingsPrepared:2,servingsEaten:null,sourceStatus:mixed?'mixed':'organic',createdAt:new Date(now).toISOString()};
  next.sessions.push(session);
  next.basket={lines:[],expiresAt:null};
  checkState(next);return next;
}
