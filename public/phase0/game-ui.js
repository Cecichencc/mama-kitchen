// Phase 1 mobile UI adapter. All inventory accounting happens in domain.js.
// Persisted stock is DEVICE-LOCAL only. Do not imply cross-phone synchronisation.
import {
  STORAGE_KEY, INGREDIENTS, RECIPE, emptyState, loadState, expireBasket,
  addGroceries, correctStock, setReservation, reserve, clearBasket, confirmCooked,
  physicalTotal, usableTotal, availableQuantity, basketQuantity, recipeReadiness,
  hasMixedSource, heldQuantity, isUsableBatch
} from './domain.js';
import {ingredientIconMarkup} from './ingredient-icons.js';
import {initRecipeDiscovery} from './recipe-discovery.js';

const byId = id => document.getElementById(id);
const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iconFor = ingredient => ingredient==='egg'?'🥚':'🍅';

export function createGameUI({i18n,onAvailability=()=>{},onHarvest=()=>{},onReturnToFarm=()=>{}}) {
  const t = key => i18n.t(key);
  let state=emptyState(),modal=null,originalFocus=null,activeIngredient='tomato',activeTab='farm';
  let currentCookKey=null,submitting=false,toastTimer=null;
  const storage=(()=>{try{return window.localStorage}catch{return null}})();
  let storageFailed=false;
  try {state=loadState(storage?.getItem(STORAGE_KEY));}
  catch(error){storageFailed=true;console.warn('Inventory could not be restored',error);state=emptyState();}
  const views={farm:byId('farmView'),today:byId('todayView'),pantry:byId('pantryView')};
  const tabs={farm:byId('navFarm'),today:byId('navToday'),pantry:byId('navPantry')};
  const panels=[...document.querySelectorAll('.game-sheet')];
  const overlay=byId('sheetBackdrop');
  const note=byId('gameToast');
  const sourceLabel=source=>t('game.'+source);
  const name=id=>t(id==='egg'?'game.eggs':'farm.tomato');
  const prettyLine=(b,q)=>`${name(b.ingredientId)} · ${q} ${t('game.pieces')} · ${sourceLabel(b.organicStatus)}`;
  const labelFor=b=>`${sourceLabel(b.organicStatus)} · ${t('game.'+b.storage)} · ${availableQuantity(state,b.id)} ${t('game.available')}`;
  const batchesOf=id=>state.batches.filter(b=>b.ingredientId===id);
  const liveBatches=id=>batchesOf(id).filter(b=>availableQuantity(state,b.id)>0);

  function toast(text){
    clearTimeout(toastTimer);note.hidden=false;note.textContent=text;
    toastTimer=setTimeout(()=>note.hidden=true,3500);
  }
  function showError(error){
    console.warn('Kitchen Garden action not completed:',error);
    const msg=String(error?.message||'');
    if(/reserved|Release reserved/i.test(msg))return toast(t('game.errorHeld'));
    if(/use-by|past its/i.test(msg))return toast(t('game.errorDate'));
    if(/not enough|quantity|stock/i.test(msg))return toast(t('game.errorStock'));
    if(/mixed|non-organic/i.test(msg))return toast(t('game.errorMixed'));
    return toast(t('game.errorGeneric'));
  }
  function save(next){
    state=next;
    try{storage?.setItem(STORAGE_KEY,JSON.stringify(state));if(!storage)storageFailed=true;}
    catch(error){storageFailed=true;console.warn('Inventory is in-memory only',error);}
    render();
    if(storageFailed)toast(t('pantry.memoryWarning'));
  }
  function transact(action){
    try{const next=action(state);if(next!==state)save(next);else render();return true;}
    catch(error){showError(error);render();return false;}
  }
  function expireOnInteraction(){const fresh=expireBasket(state);if(fresh!==state){save(fresh);toast(t('basket.expired'));}}

  function openPanel(id){
    expireOnInteraction();
    if(!modal)originalFocus=document.activeElement;
    panels.forEach(p=>p.hidden=p.id!==id);
    overlay.hidden=false;document.body.classList.add('modal-open');
    modal=byId(id);
    const focusable=modal.querySelector('[data-close],button,input,select');
    (focusable||modal).focus();
  }
  function closePanel(){
    if(!modal)return;
    panels.forEach(p=>p.hidden=true);overlay.hidden=true;
    document.body.classList.remove('modal-open');modal=null;
    if(originalFocus?.isConnected)originalFocus.focus();originalFocus=null;
  }
  function switchTab(id){
    closePanel();activeTab=id;
    for(const [key,view] of Object.entries(views))view.hidden=key!==id;
    for(const [key,tab] of Object.entries(tabs)){
      tab.classList.toggle('active',key===id);
      if(key===id)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');
    }
    if(id==='farm') {onReturnToFarm();window.dispatchEvent(new Event('resize'));}
    render();
  }
  function openRestock(id){
    closePanel();switchTab('pantry');
    byId('groceryIngredient').value=id;
    byId('groceryQuantity').focus();
  }
  function openIngredient(id){
    if(usableTotal(state,id)===0){openRestock(id);return;}
    expireOnInteraction();activeIngredient=id;
    // Grocery icon comes from the shared miniature asset library.
    byId('ingredientEmblem').innerHTML=ingredientIconMarkup(id);
    byId('ingredientHeading').textContent=name(id);
    byId('ingredientZone').textContent=t(id==='tomato'?'sheet.zone':'game.barn');
    byId('harvestQuantity').value='1';
    renderIngredient();openPanel('ingredientSheet');
  }
  function selectedSourceSummary(id){
    const sources=[...new Set(liveBatches(id).map(b=>sourceLabel(b.organicStatus)))];
    return sources.length?sources.join(' · '):t('game.noStock');
  }
  function renderIngredient(){
    const id=activeIngredient,available=usableTotal(state,id),held=basketQuantity(state,id);
    byId('ingredientHeading').textContent=name(id);
    byId('ingredientZone').textContent=t(id==='tomato'?'sheet.zone':'game.barn');
    byId('ingredientAvailability').textContent=selectedSourceSummary(id);
    const choice=byId('harvestBatch'),prior=choice.value;
    const eligible=liveBatches(id);
    choice.replaceChildren();
    if(eligible.length===0){const o=new Option(t('game.noStock'),'');choice.add(o);}
    else eligible.forEach(b=>choice.add(new Option(labelFor(b),b.id)));
    if(eligible.some(b=>b.id===prior))choice.value=prior;
    const selected=eligible.find(b=>b.id===choice.value)||eligible[0];
    byId('harvestBatch').disabled=!selected;
    byId('harvestQuantity').disabled=!selected;
    byId('harvestMinus').disabled=!selected;
    byId('harvestPlus').disabled=!selected;
    byId('harvestBtn').disabled=!selected;
    const input=byId('harvestQuantity');
    input.max=String(selected?availableQuantity(state,selected.id):1);
    input.value=String(Math.max(1,Math.min(parseInt(input.value,10)||1,Number(input.max))));
    byId('ingredientHelp').textContent=selected?t('game.selectionNotice'):t('game.noStockHelp');
  }
  function renderBasket(){
    const lines=state.basket.lines;
    const count=lines.reduce((n,l)=>n+l.quantity,0);
    byId('basketBadge').textContent=String(count);
    byId('basketBadge').hidden=count===0;
    byId('basketExpiry').textContent=lines.length?t('game.selectionNotice'):'';
    const area=byId('basketLines');
    if(!lines.length)area.innerHTML=`<p class="empty-state">${esc(t('basket.empty'))}</p>`;
    else area.innerHTML=lines.map(line=>{
      const b=state.batches.find(x=>x.id===line.batchId);
      if(!b)return '';
      return `<div class="basket-line"><span class="line-icon" aria-hidden="true">${ingredientIconMarkup(b.ingredientId)}</span><div class="line-main"><strong>${esc(name(b.ingredientId))}</strong><span>${esc(sourceLabel(b.organicStatus))} · ${esc(t('game.held'))}</span></div><div class="mini-quantity kg-basket-stepper"><button type="button" class="kg-step-button" data-basket-decrement="${esc(b.id)}" aria-label="${esc(t('game.decrease'))}" ${line.quantity<=1?'disabled':''}>−</button><output aria-live="polite" aria-label="${esc(t('game.quantity'))}">${line.quantity}</output><button type="button" class="kg-step-button kg-step-plus" data-basket-increment="${esc(b.id)}" aria-label="${esc(t('game.increase'))}" ${line.quantity>=b.onHand?'disabled':''}>+</button><button type="button" class="remove-line" data-basket-remove="${esc(b.id)}" aria-label="${esc(t('game.remove'))}">×</button></div></div>`;
    }).join('');
    const readiness=recipeReadiness(state);
    byId('basketRecipe').hidden=!lines.length;
    byId('recipeReadyNote').textContent=readiness.possible?t('game.readyRecipe'):`${t('game.needRecipe')} ${readiness.tomato}/2 ${t('game.tomatoShort')} · ${readiness.egg}/3 ${t('game.eggShort')}`;
    byId('basketRecipeBtn').disabled=!readiness.possible;
    byId('basketClearBtn').disabled=!lines.length;
  }
  function renderPantry(){
    const list=byId('stockList');
    byId('pantryBatchCount').textContent=`${state.batches.length} ${t('game.batches')}`;
    if(!state.batches.length){list.innerHTML=`<p class="empty-state">${esc(t('pantry.empty'))}</p>`;return;}
    list.innerHTML=state.batches.map(b=>{
      const held=heldQuantity(state,b.id),available=availableQuantity(state,b.id),blocked=!isUsableBatch(b);
      return `<article class="stock-batch"><div class="stock-batch-head"><strong>${ingredientIconMarkup(b.ingredientId)} ${esc(name(b.ingredientId))}</strong><span class="stock-chip">${esc(sourceLabel(b.organicStatus))}</span></div>
        <div class="stock-meta">${esc(t('game.atHome'))}: ${b.onHand} ${esc(t('game.pieces'))} · ${esc(t('game.held'))}: ${held} · ${esc(t('game.available'))}: ${available}<br>${esc(t('game.'+b.storage))}${b.useBy?' · '+esc(t('game.useBy'))+': '+esc(b.useBy):''}${blocked?' · '+esc(t('game.expired')):''}</div>
        <div class="stock-controls"><label>${esc(t('pantry.actual'))}<input class="stock-correction-input" aria-label="${esc(t('pantry.actual'))}" type="number" inputmode="numeric" min="0" max="99999" step="1" value="${b.onHand}" data-stock-value="${esc(b.id)}"/></label><button type="button" class="mini-action" data-stock-correct="${esc(b.id)}">${esc(t('game.update'))}</button><button type="button" class="mini-action warning" data-stock-empty="${esc(b.id)}">${esc(t('pantry.usedUp'))}</button></div></article>`;
    }).join('');
  }
  function renderToday(){
    const last=null,el=byId('recentCooked');
    el.hidden=!last;
    if(last){
      el.textContent=`✓ ${t('game.cookedLogged')} · ${t('game.recipeName')} · ${new Date(last.createdAt).toLocaleString(i18n.locale==='zh-CN'?'zh-CN':'en-SG',{timeZone:'Asia/Singapore',dateStyle:'medium',timeStyle:'short'})}`;
      byId('mealStatus').textContent=t('game.cookedLogged');
    }else byId('mealStatus').textContent=t('game.recipeName');
  }
  function renderRecipe(){
    const ready=recipeReadiness(state);
    byId('recipeIngredients').innerHTML=RECIPE.ingredients.map(x=>{
      const actual=basketQuantity(state,x.ingredientId);
      return `<div class="ingredient-tile"><strong>${ingredientIconMarkup(x.ingredientId)} ${esc(name(x.ingredientId))}</strong><span>${actual}/${x.quantity} ${esc(t('game.pieces'))} · ${actual>=x.quantity?esc(t('game.ready')):esc(t('game.moreNeeded'))}</span></div>`;
    }).join('');
    byId('recipeSteps').replaceChildren(...(i18n.locale==='zh-CN'?RECIPE.stepsZh:RECIPE.stepsEn).map(line=>{const li=document.createElement('li');li.textContent=line;return li;}));
    // Recipe reading never changes stock.
  }
  function renderCook(){
    byId('actualUsedLines').innerHTML=state.basket.lines.map(line=>{
      const b=state.batches.find(x=>x.id===line.batchId);
      return `<div class="basket-line"><span class="line-icon" aria-hidden="true">${ingredientIconMarkup(b.ingredientId)}</span><div class="line-main"><strong>${esc(name(b.ingredientId))}</strong><span>${esc(sourceLabel(b.organicStatus))} · ${esc(t('game.onHand'))} ${b.onHand}</span></div><input class="actual-input" aria-label="${esc(t('game.actualUsed'))} ${esc(name(b.ingredientId))}" type="number" inputmode="numeric" min="0" max="${b.onHand}" step="1" data-actual-batch="${esc(b.id)}" value="${line.quantity}"/></div>`;
    }).join('');
    currentCookKey=`cook-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    byId('organicAck').checked=false;
    updateOrganicNotice();
  }
  function actualLines(){return [...document.querySelectorAll('[data-actual-batch]')].map(input=>({batchId:input.dataset.actualBatch,quantity:Number(input.value)}));}
  function updateOrganicNotice(){
    const lines=actualLines().filter(x=>Number.isSafeInteger(x.quantity)&&x.quantity>0);
    byId('organicNotice').hidden=!hasMixedSource(state,lines);
  }
  function renderComplete(){
    byId('remainingStock').replaceChildren();
    for(const id of ['tomato','egg']){
      const span=document.createElement('span');span.textContent=`${name(id)}: ${physicalTotal(state,id)} ${t('game.pieces')}`;
      byId('remainingStock').appendChild(span);
    }
  }
  function render(){
    for(const id of ['tomato','egg'])byId(id==='tomato'?'tomatoPlotCount':'eggPlotCount').textContent=String(usableTotal(state,id));
    const empty=usableTotal(state,'tomato')+usableTotal(state,'egg')===0;
    for(const id of ['tomato','egg']){
      const btn=byId(id==='tomato'?'selectTomatoBtn':'selectEggBtn');
      btn.classList.toggle('empty-resource',usableTotal(state,id)===0);
      btn.querySelector('[data-resource-label]').textContent=usableTotal(state,id)===0?t('game.addFood'):name(id);
      const hint=byId(id==='tomato'?'tomatoEmptyHint':'eggEmptyHint');
      if(hint)hint.hidden=usableTotal(state,id)>0;
    }
    const helper=document.querySelector('.chicken-bubble');
    helper.dataset.i18n=empty?'game.helperEmpty':'game.helper';helper.textContent=t(helper.dataset.i18n);
    renderBasket();renderPantry();renderToday();
    document.querySelector('.kg-recipe-discovery')&&document.dispatchEvent(new Event('kg:recipes-refresh'));
    if(modal?.id==='ingredientSheet')renderIngredient();
    if(modal?.id==='recipeSheet')renderRecipe();
    if(modal?.id==='completeSheet')renderComplete();
    onAvailability({tomato:usableTotal(state,'tomato'),egg:usableTotal(state,'egg')});
  }
  byId('basketBtn').addEventListener('click',()=>{renderBasket();openPanel('basketSheet');});
  byId('todayBasketBtn').addEventListener('click',()=>{renderBasket();openPanel('basketSheet');});
  byId('settingsBtn').addEventListener('click',()=>openPanel('settingsSheet'));
  for(const [id,button] of Object.entries(tabs))button.addEventListener('click',()=>switchTab(id));
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',closePanel));
  overlay.addEventListener('click',closePanel);
  byId('harvestBatch').addEventListener('change',renderIngredient);
  for(const [button,delta] of [[byId('harvestMinus'),-1],[byId('harvestPlus'),1]])button.addEventListener('click',()=>{
    const input=byId('harvestQuantity');input.value=String(Math.max(1,Math.min(Number(input.max), (Number(input.value)||1)+delta)));
  });
  byId('harvestBtn').addEventListener('click',()=>{
    const batchId=byId('harvestBatch').value,quantity=Number(byId('harvestQuantity').value);
    if(!batchId)return toast(t('game.noStockHelp'));
    if(!transact(s=>reserve(s,{batchId,quantity})))return;
    onHarvest(activeIngredient);
    closePanel();toast(t('game.harvestSuccess'));
  });
  byId('restockShortcut').addEventListener('click',()=>openRestock(activeIngredient));
  byId('basketLines').addEventListener('click',event=>{
    const remove=event.target.closest('[data-basket-remove]');
    if(remove){transact(s=>setReservation(s,{batchId:remove.dataset.basketRemove,quantity:0}));return;}
    const inc=event.target.closest('[data-basket-increment]');
    const dec=event.target.closest('[data-basket-decrement]');
    const action=inc||dec;
    if(action){const batchId=inc?.dataset.basketIncrement||dec?.dataset.basketDecrement;
      const current=state.basket.lines.find(line=>line.batchId===batchId);
      if(current)transact(s=>setReservation(s,{batchId,quantity:current.quantity+(inc?1:-1)}));
    }
  });
  byId('basketClearBtn').addEventListener('click',()=>{transact(s=>clearBasket(s));toast(t('basket.returned'));});
  byId('basketRecipeBtn').addEventListener('click',()=>{renderRecipe();openPanel('recipeSheet');});
  byId('backBasketBtn').addEventListener('click',()=>{renderBasket();openPanel('basketSheet');});
  // Cooking confirmation removed: recipes are informational.
  // The recipe is the final destination.
  // No actual-used form in the recipe-first experience.
  byId('groceryForm').addEventListener('submit',event=>{
    event.preventDefault();const form=event.currentTarget;
    const ingredientId=form.elements.ingredient.value,quantity=Number(form.elements.quantity.value),organicStatus=form.elements.source.value,storage=form.elements.storage.value,useBy=byId('groceryDate').value;
    if(transact(s=>addGroceries(s,{ingredientId,quantity,organicStatus,storage,useBy}))){toast(t('pantry.added'));form.elements.quantity.value='';switchTab('farm');}
  });
  byId('stockList').addEventListener('click',event=>{
    const update=event.target.closest('[data-stock-correct]'),empty=event.target.closest('[data-stock-empty]');
    if(update){const batchId=update.dataset.stockCorrect,input=[...byId('stockList').querySelectorAll('[data-stock-value]')].find(el=>el.dataset.stockValue===batchId);
      if(input&&transact(s=>correctStock(s,{batchId,onHand:Number(input.value),reason:'count'})))toast(t('pantry.updated'));
    }else if(empty){if(transact(s=>correctStock(s,{batchId:empty.dataset.stockEmpty,onHand:0,reason:'used-outside'})))toast(t('pantry.updated'));}
  });
  // Never propose an actual household quantity without the person's explicit entry.
  document.querySelectorAll('input[name="language"]').forEach(input=>input.addEventListener('change',e=>i18n.setLocale(e.target.value)));
  document.addEventListener('kg:languagechange',()=>{
    render();
    if(modal?.id==='ingredientSheet')renderIngredient();
    else if(modal?.id==='recipeSheet')renderRecipe();
    else if(modal?.id==='completeSheet')renderComplete();
  });
  document.addEventListener('keydown',event=>{
    if(!modal)return;
    if(event.key==='Escape'){event.preventDefault();closePanel();return;}
    if(event.key!=='Tab')return;
    const controls=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,a[href]')].filter(el=>el.getClientRects().length);
    if(!controls.length){event.preventDefault();modal.focus();return;}
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  const recipeDiscovery=initRecipeDiscovery({getState:()=>state,getLocale:()=>i18n.locale});
  recipeDiscovery.render();
  render();
  if(storageFailed)toast(t('pantry.memoryWarning'));
  return {
    openIngredient,
    openBasket:()=>openPanel('basketSheet'),
    openRestock,
    backToFarm:()=>{closePanel();switchTab('farm');},
    onAvailabilityChanged(fn){onAvailability=fn;render();},
    onHarvestEffect(fn){onHarvest=fn;},
    getState(){return state;},
    closePanel,
    showFallback:()=>byId('fallback').hidden=false
  };
}
