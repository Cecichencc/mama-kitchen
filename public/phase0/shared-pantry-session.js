// Local-preview and remote-stock adapter for a future opt-in signed-in household.
// This module never migrates or uploads local groceries automatically.
import {checkState,emptyState,INGREDIENTS} from './domain.js';

export const FAMILY_SYNC_STATUS=Object.freeze({
 LOCAL:'local',CONNECTING:'connecting',ONLINE:'online',OFFLINE:'offline',
 CONFLICT:'conflict',SETUP_REQUIRED:'setup-required'
});
export function toReadOnlyInventory(rows,householdId){
 if(!Array.isArray(rows)||typeof householdId!=='string')throw Error('Invalid server inventory');
 const state=emptyState();
 const seen=new Set();
 for(const row of rows){
  if(row.household_id!==householdId||typeof row.id!=='string'||seen.has(row.id))
   throw Error('Invalid household batch');
  seen.add(row.id);
  const ingredient=INGREDIENTS[row.ingredient_id];
  if(!ingredient||row.unit!==ingredient.unit||!Number.isSafeInteger(row.version)||
     row.version<1)throw Error('Unsupported server batch');
  state.batches.push({
   id:row.id,ingredientId:row.ingredient_id,onHand:row.on_hand,
   unit:row.unit,organicStatus:row.organic_status,storage:row.storage,
   useBy:row.use_by||null,createdAt:row.created_at,version:row.version
  });
 }
 checkState(state);
 return state;
}
export function previewLocalInventoryTransfer(state){
 checkState(state);
 const batches=state.batches.filter(b=>b.onHand>0);
 const expiredOrDated=batches.filter(b=>Boolean(b.useBy));
 const totals=batches.reduce((result,b)=>{
  result[b.ingredientId]=(result[b.ingredientId]||0)+b.onHand;return result;
 },{});
 return {
  batchCount:batches.length,datedCount:expiredOrDated.length,
  ingredientCount:Object.keys(totals).length,totals,
  // A preview is information, NOT permission to upload.
  requiresExplicitConfirmation:true
 };
}

// A session only exists once a user has authenticated and chosen a household.
// No automatic writes or offline queues. The caller must explicitly opt in and
// supply a server gateway. Remote stock, never browser localStorage, is truth.
export function createSharedPantrySession({gateway,householdId,onSnapshot=()=>{}}){
 if(!gateway||typeof gateway.readBatches!=='function'||
    typeof gateway.addBatch!=='function'||typeof gateway.correctBatch!=='function')
  throw Error('A real authenticated gateway is required');
 let status=FAMILY_SYNC_STATUS.LOCAL;
 let stock=null;
 const getStatus=()=>status;
 const ensureOnline=()=>{
  if(status!==FAMILY_SYNC_STATUS.ONLINE)throw Error('Shared pantry is offline or not connected');
 };
 const snapshot=()=>{
  if(!stock)throw Error('No authoritative household snapshot loaded');
  return structuredClone(stock);
 };
 async function refresh(){
  if(status!==FAMILY_SYNC_STATUS.ONLINE)status=FAMILY_SYNC_STATUS.CONNECTING;
  try{
   const rows=await gateway.readBatches(householdId);
   const next=toReadOnlyInventory(rows,householdId);
   stock=next;status=FAMILY_SYNC_STATUS.ONLINE;
   onSnapshot(structuredClone(next));
   return snapshot();
  }catch(error){
   status=FAMILY_SYNC_STATUS.OFFLINE;
   throw error;
  }
 }
 async function addGroceries(input){
  ensureOnline();
  try{
   const result=await gateway.addBatch({householdId,...input});
   await refresh();
   return result;
  }catch(error){
   // A network error after a server commit must not be interpreted as a
   // rejected edit. Caller should re-fetch before deciding whether to retry.
   if(status!==FAMILY_SYNC_STATUS.OFFLINE)status=FAMILY_SYNC_STATUS.OFFLINE;
   throw error;
  }
 }
 async function correctStock({batchId,onHand,reason='count',requestId}){
  ensureOnline();
  const batch=stock.batches.find(b=>b.id===batchId);
  if(!batch)throw Error('Batch not found in the last synced snapshot');
  try{
   const result=await gateway.correctBatch({
    householdId,batchId,onHand,reason,requestId,expectedVersion:batch.version
   });
   await refresh();
   return result;
  }catch(error){
   if(error?.code==='STALE_VERSION'){
    status=FAMILY_SYNC_STATUS.CONFLICT;
    // A server conflict must be shown to the user, never overwritten.
    try{await refresh();}catch{}
   }else status=FAMILY_SYNC_STATUS.OFFLINE;
   throw error;
  }
 }
 function disconnect(){
  status=FAMILY_SYNC_STATUS.LOCAL;
  stock=null;
 }
 return Object.freeze({
  refresh,addGroceries,correctStock,disconnect,snapshot,getStatus
 });
}
