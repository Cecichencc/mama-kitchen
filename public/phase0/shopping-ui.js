// Accessible, optional device-local shopping checklist for curated recipes.
// The list only suggests purchases: checking or copying it never updates Pantry.
import {RECIPES,ingredientLabels,formatRecipeQuantity} from './recipes.js';
import {INGREDIENTS} from './domain.js';
import {
 SHOPPING_STORAGE_KEY,emptyShoppingList,sanitizeShoppingList,
 addRecipeToShopping,removeRecipeFromShopping,clearShoppingList,
 setShoppingChecked,calculateShoppingNeeds
} from './shopping-list.js';

const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

export function initShoppingListUI({
 getState,getLocale,onAddToPantry=()=>{},beforeOpen=()=>{},onChange=()=>{}
}){
 let shopping=emptyShoppingList(),open=false,restoreFocus=null;
 const recipeIds=RECIPES.map(x=>x.id);
 try{shopping=sanitizeShoppingList(JSON.parse(localStorage.getItem(SHOPPING_STORAGE_KEY)||'{}'),RECIPES);}catch{}
 const zh=()=>getLocale()==='zh-CN';
 const tr=(en,cn)=>zh()?cn:en;
 const title=recipe=>zh()?recipe.zh:recipe.en;
 const name=id=>ingredientLabels[id]?.[zh()?1:0]||INGREDIENTS[id]?.[zh()?'zh':'en']||id;
 const amount=(id,qty)=>formatRecipeQuantity(id,qty,getLocale());
 const summary=()=>calculateShoppingNeeds(shopping,RECIPES,getState());
 function persist(){try{localStorage.setItem(SHOPPING_STORAGE_KEY,JSON.stringify(shopping));}catch{}}
 const overlay=document.createElement('div');
 overlay.id='kgShoppingOverlay';overlay.className='kg-shopping-overlay';overlay.hidden=true;
 const panel=document.createElement('section');
 panel.id='kgShoppingSheet';panel.className='kg-shopping-sheet';
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
 panel.setAttribute('aria-labelledby','kgShoppingTitle');
 panel.tabIndex=-1;panel.hidden=true;
 document.body.append(overlay,panel);
 const textList=data=>{
  const lines=[tr('Kitchen Garden — Shopping List','厨房小农场 — 购物清单')];
  for(const entry of data.toBuy)lines.push(
   `${entry.checked?'☑':'☐'} ${name(entry.ingredientId)} — ${amount(entry.ingredientId,entry.quantity)}`
  );
  if(data.toCheck.length){
   lines.push('',tr('Check at home (amount not confirmed)','在家核对（数量未确认）'));
   for(const entry of data.toCheck)lines.push(
    `? ${name(entry.ingredientId)} — ${tr('quantity needs checking','数量需核对')}`
   );
  }
  return lines.join('\n');
 };
 function renderSheet(){
  if(!open)return;
  const data=summary(),selected=shopping.recipeIds.length;
  const recipeLabels=data.recipes.map(recipe=>
   `<li class="kg-shop-recipe"><span>${escapeHtml(title(recipe))}</span><button type="button" data-shop-remove="${escapeHtml(recipe.id)}" aria-label="${escapeHtml(tr('Remove recipe','移除菜谱'))}: ${escapeHtml(title(recipe))}">×</button></li>`
  ).join('');
  const buy=data.toBuy.map(entry=>`<li class="kg-shop-row">
    <label class="kg-shop-check">
      <input type="checkbox" data-shop-check="${escapeHtml(entry.ingredientId)}" ${entry.checked?'checked':''} />
      <span class="kg-shop-item-info">
        <strong>${escapeHtml(name(entry.ingredientId))}</strong>
        <span>${escapeHtml(tr('Need','还需'))} ${escapeHtml(amount(entry.ingredientId,entry.quantity))} · ${escapeHtml(tr('Recorded','已记录'))} ${escapeHtml(amount(entry.ingredientId,entry.recorded))}</span>
      </span>
    </label>
    <button class="kg-shop-pantry-link" type="button" data-shop-to-pantry="${escapeHtml(entry.ingredientId)}">${escapeHtml(tr('Add to Pantry','录入储藏室'))}</button>
  </li>`).join('');
  const verify=data.toCheck.map(entry=>`<li class="kg-shop-verify-row">
    <span>${escapeHtml(name(entry.ingredientId))}</span>
    <small>${escapeHtml(tr('Check amount at home','在家核对数量'))}</small>
  </li>`).join('');
  const covered=data.covered.map(entry=>`<li>${escapeHtml(name(entry.ingredientId))} · ${escapeHtml(amount(entry.ingredientId,entry.recorded))}</li>`).join('');
  panel.innerHTML=`<header class="kg-shopping-header">
   <div><span class="kg-shopping-kicker">${escapeHtml(tr('PLAN, SHOP, THEN RESTOCK','先计划 · 再购买 · 后入库'))}</span>
     <h2 id="kgShoppingTitle">${escapeHtml(tr('Shopping List','购物清单'))}</h2></div>
   <button class="kg-shop-close" type="button" data-shop-close aria-label="${escapeHtml(tr('Close shopping list','关闭购物清单'))}">×</button>
  </header>
  <p class="kg-shopping-intro">${escapeHtml(tr('Built from recipes you choose. It does not reserve food or change your Pantry.','根据所选菜谱生成；不会预留食材或改变储藏室库存。'))}</p>
  ${selected?`<div class="kg-shopping-recipes">
    <h3>${escapeHtml(tr('Recipes','已选菜谱'))} · ${selected}</h3>
    <ul>${recipeLabels}</ul>
  </div>`:`<p class="kg-shopping-empty">${escapeHtml(tr('Open a recipe and choose “Add to Shopping List” to begin.','打开菜谱，点击“加入购物清单”开始。'))}</p>`}
  ${selected?`<div class="kg-shopping-buy">
    <h3>${escapeHtml(tr('To buy','需要购买'))} · ${data.toBuy.length}</h3>
    ${data.toBuy.length?`<p class="kg-shopping-subtitle">${escapeHtml(tr('Checked','已勾选'))}: ${data.checkedItems}/${data.totalItems} · ${escapeHtml(tr('Based on recorded usable stock','按已记录的可用库存计算'))}</p>
      <ul>${buy}</ul>`:`<p class="kg-shopping-empty">${escapeHtml(tr('No quantified shortages in your recorded Pantry.','已记录库存中没有可量化的短缺。'))}</p>`}
  </div>
  ${data.toCheck.length?`<div class="kg-shopping-verify">
    <h3>${escapeHtml(tr('Check at home','先在家核对'))} · ${data.toCheck.length}</h3>
    <p class="kg-shopping-subtitle">${escapeHtml(tr('Amounts are unknown. These are NOT confirmed missing groceries.','数量未确定；这些食材不代表一定缺货。'))}</p>
    <ul>${verify}</ul>
  </div>`:''}
  ${data.covered.length?`<details class="kg-shopping-covered"><summary>${escapeHtml(tr('Already recorded','库存已足够'))} · ${data.covered.length}</summary><ul>${covered}</ul></details>`:''}
  <p class="kg-shopping-note">${escapeHtml(tr('Checking an item does not mean it was purchased. To record groceries, use Add to Pantry and confirm the quantity and source yourself.','勾选不代表已经购买。请点击“录入储藏室”，核对数量和来源后自行确认入库。'))}</p>
  <div class="kg-shopping-actions">
    <button type="button" data-shop-copy ${!data.toBuy.length&&!data.toCheck.length?'disabled':''}>${escapeHtml(tr('Copy list','复制清单'))}</button>
    <button type="button" data-shop-clear ${selected?'':'disabled'}>${escapeHtml(tr('Clear list','清空清单'))}</button>
  </div>` : ''}
  <p id="kgShopFeedback" class="kg-shopping-feedback" role="status" aria-live="polite"></p>`;
 }
 function openSheet(){
  if(open){renderSheet();panel.focus();return;}
  beforeOpen();
  restoreFocus=document.activeElement;
  open=true;overlay.hidden=false;panel.hidden=false;
  document.body.classList.add('kg-shopping-visible');
  renderSheet();panel.focus();
 }
 function closeSheet(){
  if(!open)return;
  open=false;overlay.hidden=true;panel.hidden=true;
  document.body.classList.remove('kg-shopping-visible');
  if(restoreFocus?.isConnected)restoreFocus.focus();
  restoreFocus=null;
 }
 function saveAndRender(){
  persist();onChange();if(open)renderSheet();
 }
 function addRecipe(id){
  if(shopping.recipeIds.includes(id)){openSheet();return;}
  try{shopping=addRecipeToShopping(shopping,id,RECIPES);}
  catch(error){console.warn('Unable to add recipe to shopping list',error);return;}
  // Recipe details have their own modal. Close them before opening this one.
  saveAndRender();openSheet();
 }
 document.addEventListener('click',event=>{
  const action=event.target.closest(
   '[data-shop-open],[data-shop-recipe],[data-shop-close],[data-shop-remove],[data-shop-clear],[data-shop-copy],[data-shop-to-pantry]'
  );
  if(!action)return;
  if(action.hasAttribute('data-shop-open')){openSheet();return;}
  if(action.hasAttribute('data-shop-recipe')){addRecipe(action.dataset.shopRecipe);return;}
  if(action.hasAttribute('data-shop-close')){closeSheet();return;}
  if(action.dataset.shopRemove){
   shopping=removeRecipeFromShopping(shopping,action.dataset.shopRemove,RECIPES);
   saveAndRender();return;
  }
  if(action.hasAttribute('data-shop-clear')){shopping=clearShoppingList();saveAndRender();return;}
  if(action.dataset.shopToPantry){
   const entry=summary().toBuy.find(e=>e.ingredientId===action.dataset.shopToPantry);
   if(!entry)return;
   closeSheet();
   onAddToPantry({ingredientId:entry.ingredientId,quantity:entry.quantity,unit:entry.unit});
   return;
  }
  if(action.hasAttribute('data-shop-copy')){
   const content=textList(summary()),msg=()=>document.getElementById('kgShopFeedback');
   if(!navigator.clipboard?.writeText){
    if(msg())msg().textContent=tr('Clipboard not available in this browser.','当前浏览器不支持复制。');
    return;
   }
   navigator.clipboard.writeText(content).then(()=>{
    if(msg())msg().textContent=tr('Shopping list copied.','购物清单已复制。');
   }).catch(()=>{
    if(msg())msg().textContent=tr('Could not copy. Try another browser.','复制失败，请尝试其他浏览器。');
   });
  }
 });
 panel.addEventListener('change',event=>{
  const input=event.target.closest('[data-shop-check]');
  if(!input)return;
  const entry=summary().toBuy.find(e=>e.ingredientId===input.dataset.shopCheck);
  if(!entry)return;
  shopping=setShoppingChecked(shopping,entry.ingredientId,entry.quantity,input.checked,RECIPES);
  saveAndRender();
 });
 overlay.addEventListener('click',closeSheet);
 document.addEventListener('keydown',event=>{
  if(!open)return;
  if(event.key==='Escape'){event.preventDefault();closeSheet();return;}
  if(event.key!=='Tab')return;
  const focusables=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),summary')]
    .filter(el=>el.getClientRects().length);
  const first=focusables[0],last=focusables.at(-1);
  if(!first){event.preventDefault();panel.focus();return;}
  if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel)){
   event.preventDefault();last.focus();
  }else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===panel)){
   event.preventDefault();first.focus();
  }
 });
 document.addEventListener('kg:recipes-refresh',()=>{if(open)renderSheet();});
 document.addEventListener('kg:languagechange',()=>{if(open)renderSheet();});
 return {
  isSelected:id=>shopping.recipeIds.includes(id),
  recipeCount:()=>shopping.recipeIds.length,
  openSheet,closeSheet
 };
}
