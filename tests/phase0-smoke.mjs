import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root=resolve(import.meta.dirname,'..');
const get=path=>readFileSync(resolve(root,path),'utf8');
const html=get('public/phase0/index.html');
const css=get('public/phase0/styles.css');
const js=get('public/phase0/scene.js');
const world=get('public/phase0/world.js');
const i18nSource=get('public/phase0/i18n.js');

test('existing Vite app and isolated Phase 0 entry remain separate',()=>{
  assert.match(get('index.html'),/\.\/main\.jsx/);
  assert.match(html,/src="\.\/scene\.js"/);
  assert.match(html,/href="\.\/styles\.css"/);
  for(const file of ['public/phase0/scene.js','public/phase0/world.js','public/phase0/i18n.js']){
    assert.ok(existsSync(resolve(root,file)),`${file} exists`);
  }
});

test('essential Phase 0 controls exist and are connected to events',()=>{
  for(const id of ['settingsBtn','settingsCloseBtn','overviewBtn','selectTomatoBtn','fallbackSelectBtn','closeSheetBtn','returnBtn']) {
    assert.match(html,new RegExp(`id="${id}"`));
    assert.match(js,new RegExp(`(?:el\\('${id}'\\)|getElementById\\('${id}'\\))`));
  }
  assert.match(js,/addEventListener\('pointerup'/);
  assert.match(js,/pointercancel/);
});

test('the farm uses genuine Three.js geometry, camera and mesh raycasting',()=>{
  assert.match(js,/new THREE\.WebGLRenderer/);
  assert.match(js,/new THREE\.OrthographicCamera/);
  assert.match(js,/new THREE\.Raycaster/);
  assert.match(js,/intersectObjects\(farm\.colliders,false\)/);
  assert.match(js,/cdn\.jsdelivr\.net\/npm\/three@0\.167\.1/);
  assert.match(world,/new THREE\.(ExtrudeGeometry|TubeGeometry|SphereGeometry)/);
});

test('approved pastel palette is used in 3D world and CSS tokens',()=>{
  for(const hex of ['#C9EAE6','#A8C896','#B9D5A7','#DB91A6','#FAF5EA','#FFFCF7','#F2D98D','#91D5DD','#EB8068','#315A50']){
    assert.match(css,new RegExp(hex,'i'));
  }
  assert.match(world,/houseRoof/);
  assert.match(world,/createPastelWorld/);
  assert.doesNotMatch(css,/background:radial-gradient\(ellipse at 55% 36%,#ffdc97/);
});

test('pastel toy-world assets and gentle character animation are 3D',()=>{
  for(const label of ['roundedPlatform','softBox','tree(','tomato(','archPanel(','fenceLine(','hen.position','flowerPink'])assert.ok(world.includes(label),`contains ${label}`);
  assert.match(world,/\.castShadow/);
  assert.match(js,/prefersReduced\.matches/);
});

test('responsive mobile camera, fallback and accessible modal are present',()=>{
  assert.match(js,/aspect<\.56/);
  assert.match(js,/ResizeObserver/);
  assert.match(js,/showFallback/);
  assert.match(html,/role="dialog" aria-modal="true"/);
  assert.match(html,/id="fallbackSelectBtn"/);
  assert.match(css,/@media\(max-width:360px\)/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(html,/class="bottom-nav"/);
  assert.match(html,/disabled data-i18n-title="nav\.mealsSoon"/);
});

test('Phase 0 never invents ingredient stock, reservations or cooking changes',()=>{
  assert.doesNotMatch(js,/\b(fetch|supabase|ConfirmCooked|reserveInventory|deductStock)\s*\(/);
  assert.doesNotMatch(world,/\b(fetch|supabase|localStorage|on_hand|stockMovement)\b/);
  assert.match(html,/Preview only: grocery stock is not connected yet/);
});

test('translation dictionaries cover all data-i18n keys and localized aria labels',()=>{
  const keys=[...html.matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g)].map(x=>x[1]);
  const dictionaryKeys=new Set([...i18nSource.matchAll(/'([\w.]+)':/g)].map(x=>x[1]));
  for(const key of keys)assert.ok(dictionaryKeys.has(key),`missing translation key: ${key}`);
  assert.match(i18nSource,/LANGUAGE_STORAGE_KEY/);
  assert.match(html,/value="zh-CN"/);
  assert.match(html,/value="en"/);
});

test('English is first-launch default; saved Chinese choice persists',async()=>{
  const originalCustomEvent=globalThis.CustomEvent;
  globalThis.CustomEvent=class {constructor(name,props){this.type=name;this.detail=props?.detail;}};
  try {
    const {createTranslator,LANGUAGE_STORAGE_KEY}=await import(pathToFileURL(resolve(root,'public/phase0/i18n.js')).href);
    const values=new Map();
    const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
    const textEl={dataset:{i18n:'nav.meals'},textContent:''};
    const doc={documentElement:{lang:''},title:'',querySelectorAll:query=>query==='[data-i18n]'?[textEl]:[],dispatchEvent:()=>{}};
    const locale=createTranslator({document:doc,storage});
    assert.equal(locale.locale,'en');assert.equal(doc.documentElement.lang,'en');assert.equal(textEl.textContent,"Today's Meals");
    assert.equal(locale.setLocale('zh-CN'),true);
    assert.equal(textEl.textContent,'今日三餐');
    assert.equal(values.get(LANGUAGE_STORAGE_KEY),'zh-CN');
    const reloaded=createTranslator({document:doc,storage});
    assert.equal(reloaded.locale,'zh-CN');
    assert.equal(locale.setLocale('invalid'),false);
  } finally {globalThis.CustomEvent=originalCustomEvent;}
});

test('color and localization are reusable separate from scene controller',()=>{
  assert.match(js,/import \{ createTranslator \} from '\.\/i18n\.js'/);
  assert.match(js,/import \{ createPastelWorld \} from '\.\/world\.js'/);
  assert.match(html,/data-i18n-aria="settings.open"/);
  assert.match(css,/--coral:/);
});

// Grounding tests are pure JS and do not depend on WebGL or a network CDN.
const GROUND = await import('../public/phase0/grounding.js');
test('grass/soil reference heights follow real extruded platform bevels',()=>{
  assert.ok(Math.abs(GROUND.GROUND_LEVELS.grass-.43)<1e-9);
  assert.ok(Math.abs(GROUND.GROUND_LEVELS.tomatoSoil-.62)<1e-9);
  assert.equal(GROUND.grassSurfaceY(1.58,-1.12),GROUND.GROUND_LEVELS.grass);
  assert.ok(GROUND.grassSurfaceY(-3.05,-1.72)>GROUND.GROUND_LEVELS.grass);
  assert.ok(GROUND.grassSurfaceY(3.25,-1.78)>GROUND.GROUND_LEVELS.grass);
  assert.equal(GROUND.grassSurfaceY(40,40),GROUND.GROUND_LEVELS.grass);
});

test('groundedRootY aligns each asset lowest point to a real surface',()=>{
  const {groundedRootY,GROUND_LEVELS}=GROUND;
  for(const [surface,lowest,scale] of [
    [GROUND_LEVELS.grass,.68-1.27/2-.035,1], // house bevel
    [GROUND_LEVELS.tomatoSoil,-.25*.87,1],  // tomato berry
    [GROUND_LEVELS.grass,.06-.068*.50,.76], // chicken feet
    [GROUND_LEVELS.grass,.14-.24/2-.035,1] // crate bevel
  ]){
    const base=groundedRootY(surface,lowest,scale);
    assert.ok(Math.abs((base+lowest*scale)-surface+0.012)<1e-9);
  }
});

test('tight real shadows and tiny gradient contact shadows, not displaced decals',()=>{
  assert.match(js,/shadow\.mapSize\.set\(1024,1024\)/);
  assert.match(js,/shadow\.camera\.left=-6\.2/);
  assert.match(js,/shadow\.normalBias=\.006/);
  assert.match(js,/shadow\.bias=-\.00005/);
  assert.match(js,/sunlight\.target\.position\.set/);
  assert.match(world,/new THREE\.CanvasTexture/);
  assert.match(world,/createRadialGradient/);
  assert.match(world,/plane\.castShadow=false/);
  assert.match(world,/contactShadow\(1\.58,GROUND_LEVELS\.grass/);
  assert.match(world,/contactShadow\(2\.46,henGround/);
  assert.match(world,/contactShadow\(x,GROUND_LEVELS\.tomatoSoil/);
  assert.match(world,/contactShadow\(3\.18,GROUND_LEVELS\.grass/);
  assert.match(world,/contactShadow\(x,footY/);
});

test('chicken feet stay planted during idle animation',()=>{
  assert.doesNotMatch(world,/hen\.position\.y\s*=\s*\.39\s*\+/);
  assert.match(world,/head\.position\.y=\.77\+/);
  assert.match(world,/hen\.position\.set\(2\.46,groundedRootY\(henGround/);
  assert.match(world,/g\.position\.set\(x,groundedRootY\(GROUND_LEVELS\.tomatoSoil/);
});

test('small details and earth are correctly grounded with no inventory side effects',()=>{
  assert.match(world,/crate\.name='Decorative tomato crate'/);
  assert.match(world,/petal=sphere\(\.069,M\.white,root,x\+Math\.cos\(a\)\*\.074,\.455/);
  assert.match(world,/earthBase\.castShadow=false/);
  assert.match(world,/grassTop\.receiveShadow=true/);
  assert.match(world,/tomatoBed\.receiveShadow=true/);
  assert.doesNotMatch(world,/\b(fetch\(|stockMovement|localStorage|on_hand|supabase)\b/);
});
