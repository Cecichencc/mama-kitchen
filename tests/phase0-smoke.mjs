import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const html=read('public/phase0/index.html');
const css=read('public/phase0/styles.css');
const scene=read('public/phase0/scene.js');
const world=read('public/phase0/world.js');
const ui=read('public/phase0/game-ui.js');
const domain=read('public/phase0/domain.js');
const locales=read('public/phase0/i18n.js');

test('root Vite app is preserved; phase1 remains at /phase0/',()=>{
  assert.match(read('index.html'),/\.\/main\.jsx/);
  assert.match(html,/src="\.\/scene\.js"/);
  assert.match(html,/href="\.\/styles\.css"/);
  for(const f of ['world.js','scene.js','i18n.js','grounding.js','game-ui.js','domain.js'])assert.ok(existsSync(resolve(root,'public/phase0',f)));
});
test('recipe-first farm, pantry and ingredient selection screens exist',()=>{
  for(const id of ['farmView','todayView','pantryView','ingredientSheet','basketSheet','recipeSheet','settingsSheet','basketBtn','navFarm','navToday','navPantry','harvestBtn','harvestBatch','basketLines','groceryForm','stockList','gameToast'])assert.match(html,new RegExp(`id="${id}"`),id);
  for(const removed of ['cookSheet','completeSheet','actualUsedLines','organicAck'])assert.doesNotMatch(html,new RegExp(`id="${removed}"`),removed);
  assert.match(ui,/selectQuantity/);assert.match(ui,/correctStock/);
  assert.match(ui,/SELECTION_KEY/);assert.match(ui,/STORAGE_KEY/);
  assert.doesNotMatch(ui,/transact\(s=>reserve\(/);
});
test('real 3D geometry, egg resource, movable camera and colliders remain',()=>{
  assert.match(scene,/new THREE\.WebGLRenderer/);
  assert.match(scene,/new THREE\.OrthographicCamera/);
  assert.match(scene,/new THREE\.Raycaster/);
  assert.match(scene,/intersectObjects\(farm\.colliders,false\)/);
  assert.match(scene,/three@0\.167\.1/);
  for(const x of ['new THREE.SphereGeometry','new THREE.TorusGeometry','eggCollider','createPastelWorld','playHarvest','setAvailability','fruitPositions','resourcePositions','house','hen.position'])assert.ok(world.includes(x),x);
});
test('approved style, existing shadow and grounding parameters stay stable',()=>{
  for(const hex of ['#C9EAE6','#A8C896','#B9D5A7','#DB91A6','#FAF5EA','#FFFCF7','#F2D98D','#91D5DD','#EB8068','#315A50'])assert.match(css,new RegExp(hex,'i'));
  assert.match(scene,/shadow\.mapSize\.set\(1024,1024\)/);
  assert.match(scene,/shadow\.normalBias=\.006/);
  assert.match(world,/new THREE\.CanvasTexture/);
  assert.match(world,/grassSurfaceY/);
  assert.match(world,/groundedRootY/);
});
test('WebGL fallback still exposes both ingredient actions and actual Pantry nav',()=>{
  assert.match(scene,/showFallback/);
  assert.match(html,/id="fallbackSelectBtn"/);
  assert.match(html,/id="fallbackEggBtn"/);
  assert.match(html,/id="navPantry"/);
  assert.match(html,/role="dialog" aria-modal="true"/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/@media\(max-width:360px\)/);
});
test('English/Chinese translation dictionary includes visible labels and semantic actions',()=>{
  const mod= [...html.matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g)].map(v=>v[1]);
  const dict=new Set([...locales.matchAll(/'([\w.]+)':/g)].map(v=>v[1]));
  for(const key of mod)assert.ok(dict.has(key),`missing: ${key}`);
  for(const key of [...ui.matchAll(/\bt\('([\w.]+)'\)/g)].map(x=>x[1]))assert.ok(dict.has(key),`dynamic key: ${key}`);
  assert.match(html,/value="en"/);assert.match(html,/value="zh-CN"/);
});
test('English is default, Chinese persisted and restores without reload',async()=>{
  const prev=globalThis.CustomEvent;
  globalThis.CustomEvent=class{constructor(type,options){this.type=type;this.detail=options?.detail;}};
  try{
    const mod=await import(pathToFileURL(resolve(root,'public/phase0/i18n.js')).href);
    const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
    const node={dataset:{i18n:'game.recipeName'},textContent:''};
    const doc={documentElement:{lang:''},title:'',querySelectorAll:q=>q==='[data-i18n]'?[node]:[],dispatchEvent:()=>{}};
    const tr=mod.createTranslator({document:doc,storage});assert.equal(tr.locale,'en');
    assert.equal(node.textContent,'Tomato & Egg Stir-fry');
    tr.setLocale('zh-CN');assert.equal(node.textContent,'番茄炒蛋');
    assert.equal(values.get(mod.LANGUAGE_STORAGE_KEY),'zh-CN');
    assert.equal(mod.createTranslator({document:doc,storage}).locale,'zh-CN');
  }finally{globalThis.CustomEvent=prev;}
});
test('real stock logic lives in domain, not the Three.js meshes or rendering code',()=>{
  assert.doesNotMatch(world,/\b(localStorage|stockMovement|on_hand|supabase)\b/);
  assert.doesNotMatch(scene,/\b(confirmCooked|deductStock|AddGroceries)\s*\(/);
  assert.match(domain,/export function reserve/);
  assert.match(domain,/export function confirmCooked/);
  assert.match(domain,/export function expireBasket/);
  assert.match(html,/saved on this device only/i);
});
test('UI interaction is usable without any WebGL and exposes confirmed changes',()=>{
  assert.match(ui,/onHarvest\(activeIngredient\)/);
  assert.match(ui,/onAvailability\(\{tomato:usableTotal/);
  assert.match(ui,/renderBasket\(/);
  assert.match(ui,/renderPantry\(/);
  assert.match(ui,/showError\(/);
  assert.match(ui,/onAvailabilityChanged/);
});
