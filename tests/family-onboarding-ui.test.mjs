import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=name=>readFileSync(new URL('../public/phase0/'+name,import.meta.url),'utf8');
const html=file('index.html');
const ui=file('game-ui.js');
const config=file('family-config.js');
const auth=file('family-auth.js');
const onboard=file('family-onboarding.js');
const css=file('styles.css');
const locale=file('i18n.js');

test('Pantry links to an accessible, reviewable household onboarding dialog',()=>{
 assert.match(html,/id="kgFamilySetupBtn"/);
 assert.match(html,/aria-haspopup="dialog"/);
 assert.match(html,/aria-controls="kgFamilyOnboarding"/);
 assert.match(ui,/initFamilyOnboarding\(\{getLocale:\(\)=>i18n.locale\}\)/);
 assert.match(onboard,/panel\.setAttribute\('role','dialog'\)/);
 assert.match(onboard,/panel\.setAttribute\('aria-modal','true'\)/);
 assert.match(onboard,/aria-labelledby/);
 assert.match(css,/\.kg-family-onboarding\{/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(css,/@media\(min-width:720px\)/);
});

test('feature gate prevents real sign-in, household changes or invites until configured',()=>{
 assert.match(config,/enabled:false/);
 assert.match(config,/url:''/);
 assert.match(config,/publishableKey:''/);
 assert.match(onboard,/const configured=readFamilyBackendConfig\(\)/);
 assert.match(onboard,/const auth=configured\?/);
 assert.match(onboard,/const gateway=configured\?/);
 assert.match(onboard,/busy\|\|!configured\?'disabled'/);
 assert.match(onboard,/if\(!configured\|\|busy\)return/);
 assert.match(onboard,/if\(!configured\)return/);
 assert.match(onboard,/Preview only/);
});

test('email OTP is typed manually; user JWT is in memory and separate from groceries',()=>{
 assert.match(auth,/type:'email'/);
 assert.match(auth,/create_user:true/);
 assert.match(auth,/getAccessToken/);
 assert.match(auth,/getSession:publicSession/);
 assert.match(auth,/refreshToken/);
 assert.doesNotMatch(auth,/localStorage|sessionStorage|document\.cookie/);
 assert.doesNotMatch(onboard,/location\.hash|location\.search|history\.pushState/);
 assert.doesNotMatch(onboard,/localStorage|sessionStorage/);
});

test('all onboarding paths have bilingual labels and identifiable controls',()=>{
 for(const token of [
  'Sign in with email','邮箱登录','Send email code','发送验证码',
  'Enter your email code','输入邮件验证码','Verify and continue','验证并继续',
  'Create your household','创建家庭','Join a family kitchen','加入家庭厨房',
  'Invitation code','邀请码','Copy invitation code','复制邀请码',
  'Signed out of family setup','已退出家庭设置'
 ])assert.ok(onboard.includes(token),'Missing translation: '+token);
 for(const action of [
  'data-family-step','data-family-close','data-family-form="email"',
  'data-family-form="verify"','data-family-form="create"',
  'data-family-form="join"','data-family-create-invite',
  'data-family-copy','data-family-select','data-family-signout'
 ])assert.ok(onboard.includes(action),'Missing action: '+action);
 assert.match(locale,/'family.setup': 'Explore family sharing setup'/);
 assert.match(locale,/'family.setup': '查看家庭共享设置'/);
});

test('keyboard focus, escape close, disabled form controls and clipboard actions exist',()=>{
 assert.match(onboard,/event\.key==='Escape'/);
 assert.match(onboard,/event\.key!=='Tab'/);
 assert.match(onboard,/event\.shiftKey/);
 assert.match(onboard,/panel\.focus\(\)/);
 assert.match(onboard,/focusReturn\.focus\(\)/);
 assert.match(onboard,/aria-live="polite"/);
 assert.match(onboard,/navigator\.clipboard\?\.writeText/);
 assert.match(onboard,/getClientRects\(\)\.length/);
 assert.match(onboard,/busy\|\|!configured/);
});

test('onboarding cannot read, migrate, add, correct or share physical Pantry stock',()=>{
 assert.doesNotMatch(onboard,/\.readBatches\(|\.addBatch\(|\.correctBatch\(/);
 assert.doesNotMatch(onboard,/\baddGroceries\(|\bcorrectStock\(|\bcreateSharedPantrySession\(/);
 assert.doesNotMatch(onboard,/\bpreviewLocalInventoryTransfer\(|\bSTORAGE_KEY\b/);
 assert.match(onboard,/Grocery sync is not enabled yet/);
 assert.match(onboard,/still stays on this device/);
 assert.match(html,/This device only · Not shared/);
});

test('only a signed-in owner may see the create-invitation action',()=>{
 assert.match(onboard,/selectedRole==='owner'/);
 assert.match(onboard,/auth\.getSession\(\)/);
 assert.match(onboard,/gateway\.listMembers\(id\)/);
 assert.match(onboard,/selectedRole!=='owner'/);
 assert.match(onboard,/isInvite\(code\)/);
 assert.match(onboard,/48 hours/);
});
