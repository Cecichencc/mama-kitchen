// Passwordless Family Pantry sign-in (Supabase GoTrue REST).
// Sessions and refresh tokens stay in MEMORY only (not localStorage, URL or logs).
// Email templates must use {{ .Token }} for a six-digit email OTP, NOT a magic link.
// No auth calls occur until the approved public backend config is enabled.
import {readFamilyBackendConfig} from './family-config.js';

const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP=/^[0-9]{6}$/;
export class FamilyAuthError extends Error{
 constructor(code,status=0){super(code);this.name='FamilyAuthError';this.code=code;this.status=status;}
}
const safeEmail=email=>typeof email==='string'&&email.length<=254&&EMAIL.test(email.trim())
 ? email.trim().toLowerCase():null;
const safeToken=value=>typeof value==='string'&&value.length>20?value:null;

export function createFamilyEmailAuth({
 config,fetcher=globalThis.fetch,now=()=>Date.now(),onChange=()=>{}
}={}){
 const approved=readFamilyBackendConfig(config);
 if(!approved)throw new FamilyAuthError('BACKEND_NOT_CONFIGURED');
 if(typeof fetcher!=='function')throw new FamilyAuthError('FETCH_UNAVAILABLE');
 let pendingEmail=null,session=null,codeSentAt=0,refreshing=null,generation=0;
 const api=approved.url+'/auth/v1';
 const makeHeaders=(token)=>({
  apikey:approved.publishableKey,'Content-Type':'application/json',
  ...(token?{Authorization:'Bearer '+token}:{})
 });
 async function send(path,body,token){
  let response;
  try{
   response=await fetcher(api+path,{
    method:'POST',mode:'cors',cache:'no-store',credentials:'omit',
    headers:makeHeaders(token),body:JSON.stringify(body||{})
   });
  }catch{throw new FamilyAuthError('NETWORK_UNAVAILABLE');}
  let data=null;
  try{data=await response.json();}catch{}
  if(!response.ok){
   // Never display server error bodies, provider internals or account-existence details.
   throw new FamilyAuthError(response.status===429?'RATE_LIMITED':
    response.status===401?'SIGN_IN_EXPIRED':
    'AUTH_REQUEST_FAILED',response.status);
  }
  return data;
 }
 function publicSession(){
  if(!session)return null;
  return Object.freeze({userId:session.userId,email:session.email,
   expiresAt:session.expiresAt});
 }
 function emit(){try{onChange(publicSession());}catch{}}
 function parseSession(data,email){
  const accessToken=safeToken(data?.access_token);
  const refreshToken=safeToken(data?.refresh_token);
  const expires=Number(data?.expires_in);
  const userId=data?.user?.id,confirmedEmail=safeEmail(data?.user?.email||email);
  if(!accessToken||!refreshToken||!Number.isFinite(expires)||expires<60||
     typeof userId!=='string'||!confirmedEmail)
   throw new FamilyAuthError('INVALID_AUTH_RESPONSE');
  return {
   accessToken,refreshToken,userId,email:confirmedEmail,
   expiresAt:now()+expires*1000
  };
 }
 function clear(){
  generation++;
  session=null;pendingEmail=null;codeSentAt=0;refreshing=null;emit();
 }
 async function requestCode(email){
  const normalized=safeEmail(email);
  if(!normalized)throw new FamilyAuthError('INVALID_EMAIL');
  if(codeSentAt&&now()-codeSentAt<60000)throw new FamilyAuthError('WAIT_BEFORE_RESEND');
  await send('/otp',{email:normalized,create_user:true});
  pendingEmail=normalized;codeSentAt=now();
  return {email:normalized};
 }
 async function verifyCode(code){
  if(!pendingEmail)throw new FamilyAuthError('REQUEST_EMAIL_CODE_FIRST');
  if(typeof code!=='string'||!OTP.test(code.trim()))
   throw new FamilyAuthError('INVALID_OTP');
  const currentGeneration=generation;
  const data=await send('/verify',{
   email:pendingEmail,token:code.trim(),type:'email'
  });
  if(currentGeneration!==generation)throw new FamilyAuthError('SIGN_IN_EXPIRED');
  session=parseSession(data,pendingEmail);
  pendingEmail=null;codeSentAt=0;emit();
  return publicSession();
 }
 async function getAccessToken(){
  if(!session)throw new FamilyAuthError('SIGN_IN_REQUIRED',401);
  if(now()<session.expiresAt-30000)return session.accessToken;
  if(!refreshing){
   const currentGeneration=generation;
   refreshing=(async()=>{
    try{
     const data=await send('/token?grant_type=refresh_token',{
      refresh_token:session.refreshToken
     });
     if(currentGeneration!==generation)throw new FamilyAuthError('SIGN_IN_EXPIRED');
     session=parseSession(data,session.email);emit();
     return session.accessToken;
    }catch(error){
     if(currentGeneration===generation)clear();
     throw error;
    }
   })();
  }
  const pending=refreshing;
  try{return await pending;}finally{
   // Do not clear a later in-flight refresh created after a sign-out.
   if(refreshing===pending)refreshing=null;
  }
 }
 async function signOut(){
  const accessToken=session?.accessToken;
  clear(); // Local sign-out is immediate even if remote revocation is unavailable.
  if(accessToken){
   try{await send('/logout',{},accessToken);}catch{
    // Server JWT may remain valid until expiry if network revocation fails.
   }
  }
 }
 return Object.freeze({
  requestCode,verifyCode,getAccessToken,getSession:publicSession,
  getPendingEmail:()=>pendingEmail,signOut
 });
}
