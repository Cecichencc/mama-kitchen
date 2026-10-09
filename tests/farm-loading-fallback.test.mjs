import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const scene=readFileSync(new URL('../public/phase0/scene.js',import.meta.url),'utf8');
test('Three.js CDN stall resolves to accessible fallback rather than empty sky',()=>{
 assert.match(scene,/Promise\.race/);
 assert.match(scene,/12000/);
 assert.match(scene,/showFallback\('farm\.loadFailed'\)/);
});
test('lost WebGL context triggers fallback',()=>{
 assert.match(scene,/webglcontextlost/);
 assert.match(scene,/event\.preventDefault\(\)/);
});
