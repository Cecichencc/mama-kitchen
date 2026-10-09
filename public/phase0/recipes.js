import {recordedStock,recipeCheck} from './recipe-matching.js';
// Curated starter recipes. Ingredient checks only use tracked tomato/egg stock.
// Untracked ingredients are always marked "check at home", never "available".
export const RECIPES=Object.freeze([
 {id:'tomato-egg',en:'Tomato Scrambled Eggs',zh:'番茄炒蛋',minutes:15,meal:['lunch','dinner'],category:'stir-fry',icon:'🍅',ingredients:[['tomato',2],['egg',3],['oil',null],['salt',null]],stepsEn:['Cut tomatoes and beat eggs.','Gently scramble eggs and set aside.','Soften tomatoes in a pan, then return eggs and combine.'],stepsZh:['番茄切块，鸡蛋打散。','鸡蛋炒至刚凝固，盛出。','炒软番茄，再加入鸡蛋翻匀。']},
 {id:'egg-breakfast',en:'Simple Boiled Eggs',zh:'水煮蛋',minutes:12,meal:['breakfast'],category:'breakfast',icon:'🥚',ingredients:[['egg',2]],stepsEn:['Bring water to a gentle boil.','Lower in eggs and cook until the yolks are set to your preference.','Cool briefly and serve with a balanced breakfast.'],stepsZh:['将水煮至微沸。','放入鸡蛋，煮至喜欢的熟度。','稍微放凉，搭配其他早餐食物。']},
 {id:'steamed-egg',en:'Steamed Egg Custard',zh:'蒸水蛋',minutes:18,meal:['breakfast'],category:'breakfast',icon:'🥚',ingredients:[['egg',2],['water',null]],stepsEn:['Beat eggs with water until smooth.','Strain into a heat-safe bowl and cover loosely.','Steam gently until fully set.'],stepsZh:['鸡蛋加水打匀。','过筛倒入耐热碗，轻盖。','小火蒸至完全凝固。']},
 {id:'tomato-soup',en:'Tomato Soup',zh:'番茄汤',minutes:20,meal:['lunch','dinner'],category:'soup',icon:'🥣',ingredients:[['tomato',2],['water',null],['salt',null]],stepsEn:['Cut tomatoes into wedges.','Simmer tomatoes with water until soft.','Season lightly and serve.'],stepsZh:['番茄切块。','加水煮至软烂。','少量调味后享用。']},
 {id:'bokchoy-garlic',en:'Garlic Bok Choy',zh:'蒜蓉小白菜',minutes:12,meal:['lunch','dinner'],category:'vegetable',icon:'🥬',ingredients:[['bokchoy',1],['garlic',1],['oil',null]],stepsEn:['Wash bok choy and chop garlic.','Stir-fry garlic briefly.','Add bok choy and cook until tender.'],stepsZh:['洗净小白菜，蒜切末。','先略炒蒜末。','加入小白菜炒熟。']},
 {id:'mushroom-rice',en:'Chicken Mushroom Rice',zh:'香菇鸡肉饭',minutes:30,meal:['lunch','dinner'],category:'rice',icon:'🍚',ingredients:[['chicken',250],['mushroom',4],['rice',150]],stepsEn:['Cook rice according to package instructions.','Cook chicken thoroughly and sauté mushrooms.','Combine and season lightly.'],stepsZh:['按包装说明煮米饭。','将鸡肉彻底煮熟，香菇炒香。','拌匀并少量调味。']},
 {id:'salmon-bowl',en:'Salmon & Vegetable Bowl',zh:'三文鱼蔬菜碗',minutes:25,meal:['lunch','dinner'],category:'rice',icon:'🐟',ingredients:[['salmon',null],['vegetables',null],['rice',null]],stepsEn:['Cook rice and vegetables.','Cook salmon thoroughly.','Serve together in a bowl.'],stepsZh:['煮好米饭和蔬菜。','将三文鱼彻底煮熟。','装碗享用。']},
 {id:'pumpkin-soup',en:'Pumpkin Soup',zh:'南瓜汤',minutes:25,meal:['lunch','dinner'],category:'soup',icon:'🎃',ingredients:[['pumpkin',1],['water',null]],stepsEn:['Cut pumpkin into small pieces.','Simmer until tender.','Blend carefully until smooth.'],stepsZh:['南瓜切小块。','加水煮软。','小心搅打至顺滑。']}
]);
export const TRACKED_IDS=new Set(['tomato','egg','carrot','potato','onion','garlic','mushroom','pumpkin','apple','orange','rice','chicken','fish','bokchoy','oil']);
export function recipeAvailability(recipe,state,now=Date.now()){
 return recipeCheck(recipe,recordedStock(state,now));
}
export function rankedRecipes(state,meal='all'){
 return RECIPES.filter(r=>meal==='all'||r.meal.includes(meal)).map(recipe=>({recipe,...recipeAvailability(recipe,state)}))
  .sort((a,b)=>a.missing.length-b.missing.length||a.unknown.length-b.unknown.length||a.recipe.minutes-b.recipe.minutes);
}
export const ingredientLabels={
 tomato:['Tomato','番茄'],egg:['Egg','鸡蛋'],oil:['Cooking oil','食用油'],salt:['Salt','盐'],water:['Water','水'],
 bokchoy:['Bok choy','小白菜'],garlic:['Garlic','蒜'],chicken:['Chicken','鸡肉'],mushroom:['Mushroom','香菇'],rice:['Rice','米饭'],salmon:['Salmon','三文鱼'],vegetables:['Vegetables','蔬菜'],pumpkin:['Pumpkin','南瓜'],carrot:['Carrot','胡萝卜'],potato:['Potato','土豆'],onion:['Onion','洋葱'],apple:['Apple','苹果'],orange:['Orange','橙子'],fish:['Fish','鱼肉']
};
