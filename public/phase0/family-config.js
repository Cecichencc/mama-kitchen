// Backend configuration for the *future* Family Pantry pilot.
// Deliberately disabled. No real Supabase URL, token or grocery data is stored here.
// To enable a test backend, edit this file only after a security review and approval.
// Only the public sb_publishable_ key is allowed; NEVER use service_role or sb_secret_.
export const FAMILY_BACKEND_CONFIG=Object.freeze({
 enabled:false,
 url:'',
 publishableKey:''
});

export function readFamilyBackendConfig(config=FAMILY_BACKEND_CONFIG){
 if(!config||config.enabled!==true)return null;
 if(typeof config.url!=='string'||typeof config.publishableKey!=='string')return null;
 if(!config.publishableKey.startsWith('sb_publishable_')||config.publishableKey.length<20)return null;
 try{
  const parsed=new URL(config.url);
  if(parsed.protocol!=='https:'||!parsed.hostname||
     parsed.username||parsed.password||parsed.search||parsed.hash||
     parsed.pathname!=='/'||parsed.port)return null;
  return Object.freeze({url:parsed.origin,publishableKey:config.publishableKey});
 }catch{return null;}
}
