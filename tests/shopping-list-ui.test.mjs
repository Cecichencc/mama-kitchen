import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=filename=>readFileSync(new URL('../public/phase0/'+filename,import.meta.url),'utf8');
const recipeUI=source('recipe-discovery.js');
const shoppingUI=source('shopping-ui.js');
const gameUI=source('game-ui.js');
const styles=source('styles.css');

test('Shopping List entry is available in Today’s Kitchen and recipe details',()=>{
 assert.match(recipeUI,/data-shop-open/);
 assert.match(recipeUI,/data-shop-recipe/);
 assert.match(recipeUI,/initShoppingListUI/);
 assert.match(recipeUI,/shoppingUI\.recipeCount\(\)/);
 assert.match(recipeUI,/shoppingUI\.isSelected\(r\.id\)/);
});
test('shopping list uses an accessible modal and keyboard handling',()=>{
 assert.match(shoppingUI,/aria-modal/);
 assert.match(shoppingUI,/aria-labelledby/);
 assert.match(shoppingUI,/data-shop-close/);
 assert.match(shoppingUI,/event\.key==='Escape'/);
 assert.match(shoppingUI,/event\.key!=='Tab'/);
 assert.match(shoppingUI,/\.focus\(\)/);
 assert.match(styles,/\.kg-shopping-sheet\{/);
 assert.match(styles,/@media\(max-width:360px\)/);
 assert.match(styles,/@media\(min-width:720px\)/);
});
test('Shopping List is bilingual with a distinct unquantified Check at Home section',()=>{
 for(const phrase of ['Shopping List','购物清单','To buy','需要购买',
  'Check at home','先在家核对','Amount','已记录','Clear list','清空清单']){
  assert.ok(shoppingUI.includes(phrase),phrase);
 }
 assert.match(shoppingUI,/amount not confirmed/);
 assert.match(shoppingUI,/These are NOT confirmed missing groceries/);
});
test('Shopping List checkbox and Pantry handoff never update physical stock directly',()=>{
 assert.match(shoppingUI,/setShoppingChecked/);
 assert.match(shoppingUI,/data-shop-to-pantry/);
 assert.match(shoppingUI,/onAddToPantry\(/);
 assert.doesNotMatch(shoppingUI,/\baddGroceries\s*\(|\bcorrectStock\s*\(|\bconfirmCooked\s*\(/);
 assert.match(gameUI,/onAddToPantry:\(\{ingredientId,quantity,unit\}\)=>/);
 assert.match(gameUI,/byId\('groceryQuantity'\)\.value=String\(quantity\)/);
 assert.match(gameUI,/byId\('groceryUnit'\)\.value=unit/);
 assert.match(gameUI,/renderGroceryUnits\(\)/);
});
test('Shopping List persistence uses a separate storage namespace from Pantry and basket',()=>{
 assert.match(shoppingUI,/SHOPPING_STORAGE_KEY/);
 assert.doesNotMatch(shoppingUI,/kitchen-garden\.phase1\.v1/);
 assert.doesNotMatch(shoppingUI,/kitchen-garden\.recipe-selection/);
});
