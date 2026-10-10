// Kitchen Garden / shared Pantry transport for a future authenticated Supabase setup.
// Never put a service_role key or a user's access token into a committed file.
// This module is dormant until a real authentication flow supplies a user JWT.
import {INGREDIENTS} from './domain.js';
import {toBase} from './units.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid=id=>typeof id==='string'&&UUID.test(id);
export class SharedPantryError extends Error {
 constructor(code,status=0){
  super(code);this.name='SharedPantryError';this.code=code;this.status=status;
 }
}
function configuration({url,anonKey,getAccessToken,fetcher}){
 if(typeof url!=='string'||!/^https:\/\/[^/]+/i.test(url))
  throw new SharedPantryError('SYNC_CONFIGURATION_REQUIRED');
 const endpoint=new URL(url);
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)
  throw new SharedPantryError('SYNC_CONFIGURATION_INVALID');
 if(!anonKey||typeof anonKey!=='string'||typeof getAccessToken!=='function')
  throw new SharedPantryError('SYNC_CONFIGURATION_REQUIRED');
 if(typeof fetcher!=='function')throw new SharedPantryError('FETCH_UNAVAILABLE');
 return endpoint.origin+endpoint.pathname.replace(/\/$/,'');
}
function uuid(value,label){
 if(!isUuid(value))throw new SharedPantryError('INVALID_'+label.toUpperCase());
 return value;
}
const allowedReason=new Set(['count','used-outside','discarded']);

export function createSharedPantryGateway({
 url,anonKey,getAccessToken,fetcher=fetch,makeRequestId=()=>crypto.randomUUID()
}={}){
 const base=configuration({url,anonKey,getAccessToken,fetcher});
 async function api(method,path,body){
  const token=await getAccessToken();
  if(typeof token!=='string'||!token.trim())throw new SharedPantryError('SIGN_IN_REQUIRED',401);
  let response;
  try{
   response=await fetcher(base+path,{
    method,mode:'cors',cache:'no-store',
    headers:{
     apikey:anonKey,
     Authorization:'Bearer '+token,
     'Content-Type':'application/json',
     ...(method==='POST'?{'Prefer':'return=representation'}:{})
    },
    ...(method==='POST'?{body:JSON.stringify(body)}:{})
   });
  }catch{
   // Never mark a failed/offline network call as a successful stock edit.
   throw new SharedPantryError('NETWORK_UNAVAILABLE');
  }
  let data;
  try{data=await response.json();}catch{data=null;}
  if(!response.ok){
   const serverCode=typeof data?.message==='string'?data.message:'';
   const safeCodes=new Set([
    'NOT_AUTHORIZED','AUTH_REQUIRED','INVALID_NAME','INVALID_INVITE',
    'HOUSEHOLD_FULL','ALREADY_MEMBER','INVALID_BATCH','INVALID_CORRECTION',
    'BATCH_NOT_FOUND','STALE_VERSION','IDEMPOTENCY_KEY_REUSED'
   ]);
   throw new SharedPantryError(safeCodes.has(serverCode)?serverCode:
    response.status===401?'SIGN_IN_REQUIRED':
    response.status===403?'NOT_AUTHORIZED':
    'REMOTE_REQUEST_FAILED',response.status);
  }
  return data;
 }
 const rpc=(name,args)=>api('POST','/rest/v1/rpc/'+name,args);
 return Object.freeze({
  listHouseholds:()=>api('GET','/rest/v1/kg_households?select=id,name,timezone,created_at&order=created_at.asc'),
  listMembers:householdId=>api('GET',
   '/rest/v1/kg_members?select=household_id,user_id,role,joined_at&household_id=eq.'+
   encodeURIComponent(uuid(householdId,'household'))),
  readBatches:householdId=>api('GET',
   '/rest/v1/kg_batches?select=id,household_id,ingredient_id,on_hand,unit,organic_status,storage,use_by,version,created_at'+
   '&household_id=eq.'+encodeURIComponent(uuid(householdId,'household'))+'&order=created_at.asc'),
  // Audit metadata is scoped by the same server-side household RLS policy.
  listEvents:householdId=>api('GET',
   '/rest/v1/kg_events?select=id,household_id,batch_id,request_id,event_type,delta,old_quantity,new_quantity,created_at'+
   '&household_id=eq.'+encodeURIComponent(uuid(householdId,'household'))+'&order=created_at.asc'),
  createHousehold:name=>{
   if(typeof name!=='string'||name.trim().length<1||name.trim().length>80)
    throw new SharedPantryError('INVALID_NAME');
   return rpc('kg_create_household',{p_name:name.trim()});
  },
  createInvite:householdId=>rpc('kg_create_invite',{p_household:uuid(householdId,'household')}),
  joinInvite:code=>{
   if(typeof code!=='string'||!/^[0-9a-f]{48}$/.test(code))
    throw new SharedPantryError('INVALID_INVITE');
   return rpc('kg_join_invite',{p_code:code});
  },
  addBatch:({householdId,ingredientId,quantity,inputUnit,organicStatus,storage,useBy=null,requestId}={})=>{
   const spec=INGREDIENTS[ingredientId];
   if(!spec)throw new SharedPantryError('INVALID_INGREDIENT');
   if(typeof organicStatus!=='string'||!['organic','nonorganic','unknown'].includes(organicStatus)
      ||!['fridge','freezer','pantry'].includes(storage))
    throw new SharedPantryError('INVALID_BATCH');
   const units=spec.unit;
   let n;
   try{n=toBase(quantity,inputUnit||units,units);}catch{throw new SharedPantryError('INVALID_QUANTITY');}
   const idem=uuid(requestId||makeRequestId(),'request_id');
   return rpc('kg_add_batch',{
    p_household:uuid(householdId,'household'),p_ingredient:ingredientId,
    p_quantity:n,p_unit:units,p_organic:organicStatus,p_storage:storage,
    p_use_by:useBy||null,p_request_id:idem
   });
  },
  correctBatch:({householdId,batchId,expectedVersion,onHand,reason='count',requestId}={})=>{
   if(!Number.isSafeInteger(expectedVersion)||expectedVersion<1||
      !Number.isSafeInteger(onHand)||onHand<0||onHand>99999||
      !allowedReason.has(reason))
    throw new SharedPantryError('INVALID_CORRECTION');
   return rpc('kg_correct_batch',{
    p_household:uuid(householdId,'household'),
    p_batch:uuid(batchId,'batch'),p_expected_version:expectedVersion,
    p_on_hand:onHand,p_reason:reason,p_request_id:uuid(requestId||makeRequestId(),'request_id')
   });
  }
 });
}
