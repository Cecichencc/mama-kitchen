import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const html = read('public/phase0/index.html');
const css = read('public/phase0/styles.css');
const scene = read('public/phase0/scene.js');
const world = read('public/phase0/world.js');
const locales = read('public/phase0/i18n.js');

test('legacy Vite app and standalone farm path are both retained', () => {
  assert.match(read('index.html'), /\.\/main\.jsx/);
  assert.match(html, /src="\.\/scene\.js"/);
  assert.match(html, /href="\.\/styles\.css"/);
  for (const name of ['scene.js','world.js','i18n.js']) {
    assert.ok(existsSync(resolve(root, 'public/phase0', name)));
  }
});
test('clickable controls exist and are handled', () => {
  for (const id of ['settingsBtn','settingsCloseBtn','overviewBtn','selectTomatoBtn','fallbackSelectBtn','closeSheetBtn','returnBtn']) {
    assert.ok(html.includes('id="' + id + '"'));
    assert.ok(scene.includes("el('" + id + "')"));
  }
  assert.match(scene, /addEventListener\('pointerup'/);
});
test('real WebGL scene, orthographic camera and larger mesh colliders', () => {
  assert.match(scene, /new THREE\.WebGLRenderer/);
  assert.match(scene, /new THREE\.OrthographicCamera/);
  assert.match(scene, /new THREE\.Raycaster/);
  assert.match(scene, /intersectObjects\(farm\.colliders,false\)/);
  assert.match(scene, /three@0\.167\.1/);
  assert.match(world, /new THREE\.(SphereGeometry|TubeGeometry|ExtrudeGeometry)/);
});
test('the new pastel palette replaces the dominant orange environment', () => {
  for(const hex of ['#C9EAE6','#A8C896','#B9D5A7','#DB91A6','#FAF5EA','#FFFCF7','#F2D98D','#91D5DD','#EB8068','#315A50']) {
    assert.ok(css.toUpperCase().includes(hex.toUpperCase()), hex);
  }
  assert.match(world, /WORLD_COLORS/);
  assert.doesNotMatch(css, /background:radial-gradient\(ellipse at 55% 36%,#ffdc97/);
});
test('world has 3D clay barn, vines, flowers, chickens, fences and paths', () => {
  for (const label of ['roundedPlatform(', 'softBox(', 'tree(', 'tomato(', 'archPanel(', 'fenceLine(', 'hen.position', 'flowerPink']) {
    assert.ok(world.includes(label), label);
  }
});
test('mobile fallback, modal focus and viewport-aware framing remain available', () => {
  assert.match(scene, /showFallback/);
  assert.match(scene, /prefersReduced\.matches/);
  assert.match(scene, /ResizeObserver/);
  assert.match(scene, /aspect<\.56/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /max-width:360px/);
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(html, /id="fallbackSelectBtn"/);
});
test('Phase 0 has no stock mutations or fake recipe features', () => {
  assert.doesNotMatch(scene, /\b(fetch|supabase|ConfirmCooked|reserveInventory|deductStock)\s*\(/);
  assert.doesNotMatch(world, /\b(localStorage|on_hand|stockMovement)\b/);
  assert.match(html, /Preview only: grocery stock is not connected yet/);
  assert.match(html, /disabled data-i18n-title="nav\.mealsSoon"/);
});
test('every translation attribute is declared', () => {
  const keys = [...html.matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g)].map(x => x[1]);
  for (const key of keys) assert.ok(locales.includes("'" + key + "':"), key);
  assert.match(html, /value="zh-CN"/);
  assert.match(html, /value="en"/);
});
test('English first launch, Chinese switch and storage persistence', async () => {
  const EventType = globalThis.CustomEvent;
  globalThis.CustomEvent = class {constructor(name, props){this.type=name;this.detail=props?.detail;}};
  try {
    const mod = await import(pathToFileURL(resolve(root,'public/phase0/i18n.js')).href);
    const values = new Map();
    const storage = { getItem: key => values.get(key) ?? null, setItem: (key,val) => values.set(key,val) };
    const node = { dataset:{i18n:'nav.meals'}, textContent:'' };
    const doc = { documentElement:{lang:''}, title:'', querySelectorAll:q=>q==='[data-i18n]'?[node]:[], dispatchEvent:()=>{} };
    const tr = mod.createTranslator({document:doc,storage});
    assert.equal(tr.locale,'en');
    assert.equal(node.textContent,"Today's Meals");
    tr.setLocale('zh-CN');
    assert.equal(node.textContent,'今日三餐');
    assert.equal(values.get(mod.LANGUAGE_STORAGE_KEY),'zh-CN');
    assert.equal(mod.createTranslator({document:doc,storage}).locale,'zh-CN');
    assert.equal(tr.setLocale('invalid'),false);
  } finally { globalThis.CustomEvent=EventType; }
});
test('scene, world and translations are modular', () => {
  assert.match(scene, /import \{ createTranslator \} from '\.\/i18n\.js'/);
  assert.match(scene, /import \{ createPastelWorld \} from '\.\/world\.js'/);
  assert.match(css, /--coral:/);
  assert.match(html, /data-i18n-aria="settings.open"/);
});
