import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/phase0/index.html',import.meta.url),'utf8');
const ui=readFileSync(new URL('../public/phase0/game-ui.js',import.meta.url),'utf8');
test('Pantry quantity avoids native iOS number validation',()=>{
 assert.match(html,/id="groceryForm"[^>]*novalidate/);
 assert.match(html,/id="groceryQuantity"[^>]*type="text"[^>]*inputmode="decimal"/);
 assert.match(html,/id="groceryQuantityError"/);
});
test('Pantry quantity handles valid typed values and bilingual inline errors',()=>{
 assert.match(ui,/raw=input\.value\.trim\(\)\.replace\(',', '\.'\)/);
 assert.match(ui,/Number\.isFinite\(quantity\)/);
 assert.match(ui,/请输入有效的正数数量/);
});
