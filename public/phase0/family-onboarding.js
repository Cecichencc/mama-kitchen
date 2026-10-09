// Family Pantry onboarding: sign in by email OTP, create/join a household,
// and issue a one-use invitation. NOT an inventory sync or migration screen.
// With the feature gate disabled, users can preview UX but cannot call a backend.
import {FAMILY_BACKEND_CONFIG,readFamilyBackendConfig} from './family-config.js';
import {createFamilyEmailAuth,FamilyAuthError} from './family-auth.js';
import {createSharedPantryGateway} from './shared-pantry-gateway.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));

const errorCopy={
 BACKEND_NOT_CONFIGURED:['A secure test backend is not connected yet.','安全测试服务器尚未连接。'],
 INVALID_EMAIL:['Enter a valid email address.','请输入有效的电子邮箱。'],
 INVALID_OTP:['Enter the six-digit email code.','请输入邮件中的六位验证码。'],
 REQUEST_EMAIL_CODE_FIRST:['Request an email code first.','请先发送邮箱验证码。'],
 WAIT_BEFORE_RESEND:['Please wait one minute before requesting another code.','请等待一分钟后再发送验证码。'],
 AUTH_REQUEST_FAILED:['Sign-in could not be completed. Please retry.','无法完成登录，请稍后重试。'],
 RATE_LIMITED:['Too many attempts. Please try later.','尝试次数过多，请稍后重试。'],
 NETWORK_UNAVAILABLE:['Network unavailable. Nothing was changed.','网络不可用，未做任何修改。'],
 INVALID_AUTH_RESPONSE:['The sign-in response was incomplete. Please retry.','登录信息不完整，请重新尝试。'],
 SIGN_IN_REQUIRED:['Please sign in first.','请先登录。'],
 SIGN_IN_EXPIRED:['Your session expired. Please sign in again.','登录已过期，请重新登录。'],
 INVALID_INVITE:['The invitation is invalid, expired or already used.','邀请码无效、已过期或已被使用。'],
 HOUSEHOLD_FULL:['This household already has two members.','该家庭已有两名成员。'],
 ALREADY_MEMBER:['You already belong to this household.','你已加入这个家庭。'],
 NOT_AUTHORIZED:['Only an authorised household member can do that.','只有授权的家庭成员才能操作。'],
 INVALID_NAME:['Enter a household name (up to 80 characters).','请输入家庭名称（最多80字）。'],
 REMOTE_REQUEST_FAILED:['Unable to load household details. Please retry.','无法读取家庭信息，请稍后重试。'],
 INVALID_CODE:['Enter the 48-character invitation code.','请输入48位邀请码。'],
 SIGN_IN_FIRST:['Sign in before creating or joining a household.','请先登录，再创建或加入家庭。']
};
const isInvite=value=>typeof value==='string'&&/^[a-f0-9]{48}$/.test(value.trim().toLowerCase());
const fromRpc=(result,key)=>typeof result==='string'?result:
 Array.isArray(result)?(result[0]?.[key]||''):
 (result?.[key]||'');

export function initFamilyOnboarding({getLocale}){
 const configured=readFamilyBackendConfig();
 const auth=configured?createFamilyEmailAuth({config:FAMILY_BACKEND_CONFIG}):null;
 const gateway=configured?createSharedPantryGateway({
  url:configured.url,anonKey:configured.publishableKey,
  getAccessToken:()=>auth.getAccessToken()
 }):null;

 let opened=false,mode='intro',busy=false,message='',error='',focusReturn=null;
 let households=[],selectedId=null,selectedRole=null,inviteCode='';
 const zh=()=>getLocale()==='zh-CN';
 const tr=(english,chinese)=>zh()?chinese:english;
 const safeError=value=>{
  const code=typeof value==='string'?value:value?.code||value?.message;
  return (errorCopy[code]||errorCopy.REMOTE_REQUEST_FAILED)[zh()?1:0];
 };
 const backdrop=document.createElement('div');
 backdrop.className='kg-family-backdrop';backdrop.hidden=true;
 const panel=document.createElement('section');
 panel.id='kgFamilyOnboarding';panel.className='kg-family-onboarding';panel.hidden=true;
 panel.tabIndex=-1;panel.setAttribute('role','dialog');
 panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','kgFamilyDialogTitle');
 document.body.append(backdrop,panel);
 const trigger=document.getElementById('kgFamilySetupBtn');

 function routeButton(id,en,cn){
  return `<button type="button" data-family-step="${id}" aria-current="${mode===id?'step':'false'}">${esc(tr(en,cn))}</button>`;
 }
 function introMarkup(){
  return `<p class="kg-family-explain">${esc(tr(
   'One household, two signed-in people. Inventory stays on this device until a separate sharing and migration step.',
   '一个家庭，两个人分别登录。食材仍保留在这台设备，直到另外确认共享与转移。'))}</p>
   <div class="kg-family-intro-tiles">
    <div><strong>${esc(tr('Step 1 · Sign in','第一步 · 邮箱登录'))}</strong><span>${esc(tr('Request a six-digit code by email.','通过邮件接收六位验证码。'))}</span></div>
    <div><strong>${esc(tr('Step 2 · Create a household','第二步 · 创建家庭'))}</strong><span>${esc(tr('Choose a short name for your kitchen.','给家庭厨房起一个简单的名字。'))}</span></div>
    <div><strong>${esc(tr('Step 3 · Invite or join','第三步 · 邀请或加入'))}</strong><span>${esc(tr('Share a one-use invitation code, valid for 48 hours.','使用48小时有效的一次性邀请码。'))}</span></div>
   </div>
   <button class="kg-family-primary" type="button" data-family-step="signin">${esc(tr('Explore sign-in','查看登录流程'))}</button>`;
 }
 function emailMarkup(){
  return `<form data-family-form="email" novalidate>
    <h3>${esc(tr('Sign in with email','邮箱登录'))}</h3>
    <p>${esc(tr('We will email a six-digit code. A password is not needed.','我们会通过邮件发送六位验证码，无需设置密码。'))}</p>
    <label for="kgFamilyEmail">${esc(tr('Email address','电子邮箱'))}</label>
    <input id="kgFamilyEmail" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="name@example.com" ${busy||!configured?'disabled':''} />
    <button class="kg-family-primary" type="submit" ${busy||!configured?'disabled':''}>${esc(tr('Send email code','发送验证码'))}</button>
   </form>`;
 }
 function codeMarkup(){
  return `<form data-family-form="verify" novalidate>
    <h3>${esc(tr('Enter your email code','输入邮件验证码'))}</h3>
    <p>${esc(tr('Check the inbox for the email address you entered.','请查看刚才填写的电子邮箱。'))}</p>
    <label for="kgFamilyOtp">${esc(tr('Six-digit code','六位验证码'))}</label>
    <input id="kgFamilyOtp" name="otp" inputmode="numeric" autocomplete="one-time-code" type="text" maxlength="6" placeholder="••••••" ${busy||!configured?'disabled':''}/>
    <button class="kg-family-primary" type="submit" ${busy||!configured?'disabled':''}>${esc(tr('Verify and continue','验证并继续'))}</button>
    <button class="kg-family-text-btn" type="button" data-family-resend ${busy||!configured?'disabled':''}>${esc(tr('Resend code','重新发送验证码'))}</button>
   </form>`;
 }
 function householdsMarkup(){
  const signed=auth?.getSession();
  return `<h3>${esc(tr('Choose your household','选择家庭'))}</h3>
   <p>${esc(tr('Signed in as','当前登录'))}: <strong>${esc(signed?.email||tr('Not signed in','尚未登录'))}</strong></p>
   ${households.length?`<ul class="kg-family-households">
    ${households.map(home=>`<li><button type="button" data-family-select="${esc(home.id)}">
      <strong>${esc(home.name)}</strong><span>${esc(tr('View members and invitations','查看成员和邀请'))}</span>
    </button></li>`).join('')}</ul>`:
    `<p class="kg-family-empty">${esc(tr('No joined households yet. Create one or join with an invitation.','尚未加入家庭。你可以创建一个家庭或使用邀请码加入。'))}</p>`}
   <div class="kg-family-options">
    <button type="button" data-family-step="create">${esc(tr('Create a household','创建家庭'))}</button>
    <button type="button" data-family-step="join">${esc(tr('Join with invitation','使用邀请码加入'))}</button>
   </div>
   <button class="kg-family-text-btn" type="button" data-family-signout>${esc(tr('Sign out','退出登录'))}</button>`;
 }
 function createMarkup(){
  return `<form data-family-form="create" novalidate>
    <h3>${esc(tr('Create your household','创建家庭'))}</h3>
    <p>${esc(tr('One kitchen shared by two signed-in family members. No groceries are uploaded here.','一个厨房由两名登录的家人共享。此处不会上传食材。'))}</p>
    <label for="kgFamilyName">${esc(tr('Household name','家庭名称'))}</label>
    <input id="kgFamilyName" type="text" name="household" maxlength="80" placeholder="${esc(tr('Our Kitchen','我们的厨房'))}" ${busy||!configured?'disabled':''}/>
    <button class="kg-family-primary" type="submit" ${busy||!configured?'disabled':''}>${esc(tr('Create household','创建家庭'))}</button>
   </form>`;
 }
 function joinMarkup(){
  return `<form data-family-form="join" novalidate>
    <h3>${esc(tr('Join a family kitchen','加入家庭厨房'))}</h3>
    <p>${esc(tr('Ask the household owner for their private 48-character invite code. Each code can be used once within 48 hours.','向创建家庭的人索取私密的48位邀请码。每个邀请码只能在48小时内使用一次。'))}</p>
    <label for="kgFamilyInviteCode">${esc(tr('Invitation code','邀请码'))}</label>
    <textarea id="kgFamilyInviteCode" name="code" rows="2" maxlength="48" spellcheck="false" autocorrect="off" autocapitalize="none" placeholder="${esc(tr('Paste the invitation code','粘贴邀请码'))}" ${busy||!configured?'disabled':''}></textarea>
    <button class="kg-family-primary" type="submit" ${busy||!configured?'disabled':''}>${esc(tr('Join household','加入家庭'))}</button>
   </form>`;
 }
 function inviteMarkup(){
  const chosen=households.find(home=>home.id===selectedId);
  return `<h3>${esc(chosen?.name||tr('Family kitchen','家庭厨房'))}</h3>
   <p>${esc(tr('Member access is set up. Physical grocery sharing is still disabled until a later reviewed sync milestone.',
    '家庭成员已设置。实际食材同步仍需等待后续审核后启用。'))}</p>
   <div class="kg-family-member-role">${esc(selectedRole==='owner'?tr('Household owner','家庭创建者'):tr('Household member','家庭成员'))}</div>
   ${selectedRole==='owner'?`<button class="kg-family-primary" type="button" data-family-create-invite ${busy?'disabled':''}>${esc(tr('Create a 48-hour invitation','生成48小时邀请码'))}</button>`:''}
   ${inviteCode?`<div class="kg-family-invite-result" role="status">
     <strong>${esc(tr('Private, one-use code','私密的一次性邀请码'))}</strong>
     <code>${esc(inviteCode)}</code>
     <p>${esc(tr('Give this code only to your family member. It will not be shown again after you close this screen.',
      '请只把邀请码发给家人。关闭此页面后不会再次显示。'))}</p>
     <button type="button" data-family-copy>${esc(tr('Copy invitation code','复制邀请码'))}</button>
   </div>`:''}
   <button class="kg-family-text-btn" type="button" data-family-step="households">${esc(tr('Back to households','返回家庭列表'))}</button>`;
 }
 function render(){
  if(!opened)return;
  const disabledNotice=!configured?`<p class="kg-family-disabled" role="status">${esc(tr(
    'Preview only — no secure test backend is configured. Email, account and invite actions are disabled.',
    '仅供预览：尚未配置安全测试服务器。发送邮件、创建账户和邀请码功能暂不可用。'))}</p>`:'';
  const tabButtons=[
   routeButton('signin','1. Sign in','1. 登录'),
   routeButton('create','2. Create','2. 创建'),
   routeButton('join','3. Join','3. 加入')
  ].join('');
  const content=mode==='signin'?emailMarkup():mode==='verify'?codeMarkup():
   mode==='households'?householdsMarkup():mode==='create'?createMarkup():
   mode==='join'?joinMarkup():mode==='invite'?inviteMarkup():introMarkup();
  panel.innerHTML=`<div class="kg-family-onboarding-top">
    <div><small>${esc(tr('FAMILY PANTRY · ONBOARDING','家庭共享 · 设置流程'))}</small>
      <h2 id="kgFamilyDialogTitle">${esc(tr('Family Sharing Setup','家庭共享设置'))}</h2></div>
    <button class="kg-family-close" type="button" data-family-close aria-label="${esc(tr('Close','关闭'))}">×</button>
   </div>
   <nav class="kg-family-step-nav" aria-label="${esc(tr('Family setup steps','家庭设置步骤'))}">${tabButtons}</nav>
   ${disabledNotice}
   <div class="kg-family-stage">${content}</div>
   <div class="kg-family-response" role="status" aria-live="polite">
     ${error?`<p class="kg-family-error">${esc(error)}</p>`:''}
     ${message?`<p class="kg-family-success">${esc(message)}</p>`:''}
   </div>
   <p class="kg-family-disclaimer">${esc(tr(
    'Account setup is separate from stock synchronisation. Your Pantry still stays on this device.',
    '家庭账户设置与食材同步是两个步骤。目前食材仍只保存在这台设备。'))}</p>`;
 }
 function open(){
  if(opened)return;
  opened=true;focusReturn=document.activeElement;
  panel.hidden=false;backdrop.hidden=false;
  document.body.classList.add('kg-family-dialog-open');
  mode=auth?.getSession()?'households':'intro';message='';error='';
  render();panel.focus();
 }
 function close(){
  if(!opened)return;
  opened=false;panel.hidden=true;backdrop.hidden=true;inviteCode='';
  document.body.classList.remove('kg-family-dialog-open');
  if(focusReturn?.isConnected)focusReturn.focus();
  focusReturn=null;
 }
 async function perform(action){
  if(busy)return;
  busy=true;error='';message='';render();
  try{await action();}catch(e){error=safeError(e);}
  finally{busy=false;render();}
 }
 async function loadHouseholds(){
  households=await gateway.listHouseholds();
  if(!Array.isArray(households))throw new FamilyAuthError('REMOTE_REQUEST_FAILED');
  selectedId=null;selectedRole=null;inviteCode='';
 }
 async function selectHousehold(id){
  const matched=households.find(x=>x.id===id);
  if(!matched)throw new FamilyAuthError('NOT_AUTHORIZED');
  const members=await gateway.listMembers(id);
  const person=auth.getSession();
  const member=members.find(x=>x.user_id===person?.userId);
  if(!member)throw new FamilyAuthError('NOT_AUTHORIZED');
  selectedId=id;selectedRole=member.role;inviteCode='';
  mode='invite';
 }
 async function handleSubmit(event){
  const form=event.target.closest('form[data-family-form]');
  if(!form||!panel.contains(form))return;
  event.preventDefault();
  if(!configured||busy)return;
  const data=new FormData(form),action=form.dataset.familyForm;
  if(action==='email'){
   const email=String(data.get('email')||'');
   await perform(async()=>{
    await auth.requestCode(email);
    mode='verify';
    message=tr('Check your email for the sign-in code.','请查看邮件中的验证码。');
   });
  }else if(action==='verify'){
   const code=String(data.get('otp')||'');
   await perform(async()=>{
    await auth.verifyCode(code);
    await loadHouseholds();mode='households';
    message=tr('Signed in. Now create or join your family kitchen.','已登录。现在可以创建或加入家庭。');
   });
  }else if(action==='create'){
   const name=String(data.get('household')||'').trim();
   await perform(async()=>{
    if(!auth.getSession())throw new FamilyAuthError('SIGN_IN_REQUIRED');
    if(!name||name.length>80)throw new FamilyAuthError('INVALID_NAME');
    const result=await gateway.createHousehold(name);
    const id=fromRpc(result,'kg_create_household');
    await loadHouseholds();
    if(id)await selectHousehold(id);
    else mode='households';
    message=tr('Household created. Grocery sync is not enabled yet.',
     '家庭已创建，但尚未开启食材同步。');
   });
  }else if(action==='join'){
   const code=String(data.get('code')||'').trim().toLowerCase();
   await perform(async()=>{
    if(!auth.getSession())throw new FamilyAuthError('SIGN_IN_REQUIRED');
    if(!isInvite(code))throw new FamilyAuthError('INVALID_CODE');
    const result=await gateway.joinInvite(code);
    const id=fromRpc(result,'kg_join_invite');
    await loadHouseholds();
    if(id)await selectHousehold(id);
    else mode='households';
    message=tr('Joined your household. Grocery sync is not enabled yet.',
     '你已加入家庭，但尚未开启食材同步。');
   });
  }
 }
 async function handleClick(event){
  const button=event.target.closest('[data-family-step],[data-family-close],[data-family-signout],[data-family-resend],[data-family-select],[data-family-create-invite],[data-family-copy]');
  if(!button||!panel.contains(button)||busy)return;
  if(button.hasAttribute('data-family-close')){close();return;}
  if(button.dataset.familyStep){
   const next=button.dataset.familyStep;
   inviteCode='';error='';message='';
   if(configured&&!auth.getSession()&&['create','join','households','invite'].includes(next)){
    mode='signin';error=safeError('SIGN_IN_FIRST');
   }else{
    mode=next;
    if(mode==='households'&&configured)await perform(loadHouseholds);
   }
   render();return;
  }
  if(!configured)return;
  if(button.hasAttribute('data-family-resend')){
   await perform(async()=>{
    await auth.requestCode(auth.getPendingEmail());
    message=tr('Another email code was requested.','已重新请求发送验证码。');
   });return;
  }
  if(button.hasAttribute('data-family-signout')){
   await perform(async()=>{await auth.signOut();
    mode='signin';households=[];selectedId=null;inviteCode='';
    message=tr('Signed out of family setup. Local Pantry unchanged.','已退出家庭设置，本地库存未更改。');
   });return;
  }
  if(button.dataset.familySelect){
   await perform(()=>selectHousehold(button.dataset.familySelect));return;
  }
  if(button.hasAttribute('data-family-create-invite')){
   await perform(async()=>{
    if(selectedRole!=='owner'||!selectedId)throw new FamilyAuthError('NOT_AUTHORIZED');
    const result=await gateway.createInvite(selectedId);
    const code=fromRpc(result,'kg_create_invite');
    if(!isInvite(code))throw new FamilyAuthError('REMOTE_REQUEST_FAILED');
    inviteCode=code;
   });return;
  }
  if(button.hasAttribute('data-family-copy')&&inviteCode){
   await perform(async()=>{
    if(!navigator.clipboard?.writeText)throw new FamilyAuthError('COPY_UNAVAILABLE');
    try{await navigator.clipboard.writeText(inviteCode);}
    catch{throw new FamilyAuthError('COPY_UNAVAILABLE');}
    message=tr('Invitation code copied. Share it privately.','邀请码已复制，请私下发送给家人。');
   });
  }
 }
 panel.addEventListener('click',event=>{void handleClick(event);});
 panel.addEventListener('submit',event=>{void handleSubmit(event);});
 backdrop.addEventListener('click',close);
 trigger?.addEventListener('click',open);
 document.addEventListener('kg:languagechange',render);
 document.addEventListener('keydown',event=>{
  if(!opened)return;
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(event.key!=='Tab')return;
  const controls=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href]')]
   .filter(el=>el.getClientRects().length);
  if(!controls.length){event.preventDefault();panel.focus();return;}
  const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel)){
   event.preventDefault();last.focus();
  }else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===panel)){
   event.preventDefault();first.focus();
  }
 });
 return Object.freeze({open,close,isConfigured:()=>Boolean(configured)});
}
