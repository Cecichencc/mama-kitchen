import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root,'public/phase0/index.html'),'utf8');
const css = readFileSync(resolve(root,'public/phase0/styles.css'),'utf8');
const js = readFileSync(resolve(root,'public/phase0/scene.js'),'utf8');

test('isolated static entry and referenced files exist',()=>{
  assert.match(html,/src="\.\/scene\.js"/);
  assert.match(html,/href="\.\/styles\.css"/);
  assert.ok(existsSync(resolve(root,'public/phase0/scene.js')));
});
test('all clickable DOM controls exist',()=>{
  ['overviewBtn','selectTomatoBtn','fallbackSelectBtn','closeSheetBtn','returnBtn'].forEach(id=>{
    assert.match(html,new RegExp(`id="${id}"`));
    assert.match(js,new RegExp(`getElementById\\('${id}'\\)`));
  });
});
test('scene uses genuine WebGL, 3D meshes and raycast selection',()=>{
  assert.match(js,/new THREE\.WebGLRenderer/);
  assert.match(js,/new THREE\.OrthographicCamera/);
  assert.match(js,/new THREE\.Raycaster/);
  assert.match(js,/intersectObject\(collider,false\)/);
  assert.match(js,/0\.167\.1/);
});
test('Phase 0 makes no stock changes or server writes',()=>{
  assert.doesNotMatch(js,/\b(fetch|localStorage|supabase|ConfirmCooked|inventoryRepository)\s*\(/);
  assert.match(html,/不会添加、预留或扣除实际库存/);
});
test('WebGL fallback and accessibility are present',()=>{
  assert.match(js,/showFallback/);
  assert.match(js,/prefers-reduced-motion/);
  assert.match(html,/aria-modal="true"/);
  assert.match(html,/lang="zh-CN"/);
  assert.match(css,/max-width:360px/);
});
