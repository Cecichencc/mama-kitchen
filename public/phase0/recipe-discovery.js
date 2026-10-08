import {rankedRecipes,RECIPES,recipeAvailability,ingredientLabels} from './recipes.js';
const key='kitchen-garden.recipe-favourites.v1';
export function initRecipeDiscovery({getState,getLocale}){
 const host=document.getElementById('todayView');
 const root=document.createElement('section');root.className='kg-recipe-discovery';
 host.append(root);host.classList.add('kg-recipe-enabled');
 let meal='all',offset=0,detail=null;
 let fav=[];try{fav=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(fav))fav=[];}catch{fav=[];}
 const zh=()=>getLocale()==='zh-CN';
 const tr=(en,cn)=>zh()?cn:en;
 const title=r=>zh()?r.zh:r.en;
 const label=id=>ingredientLabels[id]?.[zh()?1:0]||id;
 function badge(item){return item.ready?tr('All ingredients available','食材齐全'):item.missing.length?tr('Missing: ','缺少：')+item.missing.map(label).join(', '):tr('Check untracked ingredients at home','请核对未记录的食材');}
 function card(item,featured=false){const r=item.recipe;return `<article class="kg-recipe-card ${featured?'featured':''}">
 <div class="kg-recipe-illustration" aria-hidden="true"><span>${r.icon}</span></div>
 <div class="kg-recipe-content"><div class="kg-recipe-heading"><h3>${title(r)}</h3><button type="button" class="kg-fav" data-fav="${r.id}" aria-label="${tr('Toggle favourite','收藏或取消收藏')} ${title(r)}" aria-pressed="${fav.includes(r.id)}">${fav.includes(r.id)?'♥':'♡'}</button></div>
 <p class="kg-recipe-meta">◷ ${r.minutes} ${tr('min','分钟')} · ${tr('Easy home cooking','家常简易')}</p>
 <p class="kg-recipe-status ${item.ready?'ready':item.missing.length?'missing':'unknown'}">${badge(item)}</p>
 <button type="button" class="cta-button" data-open-recipe="${r.id}">${tr('View Recipe','查看做法')}</button></div></article>`;}
 function render(){
  const items=rankedRecipes(getState(),meal),pick=items[offset%Math.max(1,items.length)];
  root.innerHTML=`<header class="kg-recipes-head"><h2>${tr('Recipe Ideas','菜谱推荐')}</h2><p>${tr('Ideas based on your recorded groceries. Untracked ingredients must be checked at home.','根据已记录的食材推荐，未记录的食材请自行核对。')}</p></header>
  <div class="kg-recipe-filters">${[['all','All','全部'],['breakfast','Breakfast','早餐'],['lunch','Lunch','午餐'],['dinner','Dinner','晚餐']].map(([id,en,cn])=>`<button type="button" data-meal="${id}" class="${meal===id?'active':''}" aria-pressed="${meal===id}">${tr(en,cn)}</button>`).join('')}</div>
  ${pick?card(pick,true):''}
  <button class="kg-another" type="button" data-another>${tr('↻ Another Idea','↻ 换一道')}</button>
  <h3 class="kg-more-title">${tr('More recipe ideas','更多菜谱')}</h3><div class="kg-more-recipes">${items.filter(x=>x.recipe.id!==pick?.recipe.id).map(x=>card(x)).join('')}</div>`;
  if(detail)showDetail(detail);
 }
 function showDetail(id){
  const r=RECIPES.find(x=>x.id===id);if(!r)return;detail=id;
  let panel=document.getElementById('kgRecipeDetail');
  if(!panel){panel=document.createElement('section');panel.id='kgRecipeDetail';panel.className='kg-recipe-detail';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.tabIndex=-1;document.body.append(panel);}
  const avail=recipeAvailability(r,getState());
  panel.innerHTML=`<div class="kg-detail-top"><button type="button" data-close-detail aria-label="${tr('Close','关闭')}">×</button><button type="button" data-fav="${r.id}" aria-label="${tr('Toggle favourite','收藏或取消收藏')}">${fav.includes(r.id)?'♥':'♡'}</button></div>
  <div class="kg-detail-art" aria-hidden="true">${r.icon}</div><h2>${title(r)}</h2><p>◷ ${r.minutes} ${tr('min','分钟')} · ${tr('Serves 2','两人份')}</p><p class="kg-recipe-status">${badge({...avail,recipe:r})}</p>
  <h3>${tr('Ingredients','食材')}</h3><ul>${r.ingredients.map(([id,q])=>`<li>${label(id)} <span>${q??tr('To taste / as needed','适量')}</span></li>`).join('')}</ul>
  <h3>${tr('Steps','做法')}</h3><ol>${(zh()?r.stepsZh:r.stepsEn).map(step=>`<li>${step}</li>`).join('')}</ol>
  <p class="kg-recipe-footnote">${tr('Viewing recipes never changes your grocery stock.','查看菜谱不会改变食材库存。')}</p>`;
  panel.hidden=false;document.body.classList.add('kg-detail-open');panel.focus();
 }
 function closeDetail(){const p=document.getElementById('kgRecipeDetail');if(p)p.hidden=true;detail=null;document.body.classList.remove('kg-detail-open');}
 function toggleFav(id){fav=fav.includes(id)?fav.filter(x=>x!==id):[...fav,id];try{localStorage.setItem(key,JSON.stringify(fav));}catch{}render();}
 document.addEventListener('click',e=>{const el=e.target.closest('[data-meal],[data-another],[data-open-recipe],[data-close-detail],[data-fav]');if(!el)return;
  if(el.dataset.meal){meal=el.dataset.meal;offset=0;render();}
  else if(el.hasAttribute('data-another')){offset++;render();}
  else if(el.dataset.openRecipe)showDetail(el.dataset.openRecipe);
  else if(el.hasAttribute('data-close-detail'))closeDetail();
  else if(el.dataset.fav)toggleFav(el.dataset.fav);
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&detail){closeDetail();}});
 document.addEventListener('kg:languagechange',render);
 document.addEventListener('kg:recipes-refresh',render);
 return {render};
}
