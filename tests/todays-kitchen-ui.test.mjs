import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../public/phase0/recipe-discovery.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/phase0/styles.css',import.meta.url),'utf8');
test('Today’s Kitchen shows three meals before optional recipe library',()=>{
 assert.match(ui,/root\.innerHTML=`\$\{dailyMarkup\(plan\)\}<section class="kg-extra-recipes"/);
 assert.match(ui,/data-toggle-more aria-expanded/);
 assert.match(ui,/showMore=!showMore;render\(\)/);
});
test('recipe library starts collapsed and can be expanded',()=>{
 assert.match(ui,/showMore=false/);
 assert.match(css,/\.kg-extra-recipes\[hidden\]\{display:none!important\}/);
});
test('mobile layout protects meal cards and long ingredient warnings',()=>{
 assert.match(css,/@media\(max-width:390px\)/);
 assert.match(css,/\.kg-daily-meal \.kg-recipe-status\{overflow-wrap:anywhere/);
});
