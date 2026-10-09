// Kitchen Garden — curated, home-style Chinese recipes for two people.
// Amounts are starter recipe estimates (not medical portion prescriptions).
// Pantry quantities are integer BASE units: piece, g, ml, bunch.
// null amounts must be checked by the cook and are never treated as available.
export const HOME_RECIPES=Object.freeze([
  {
    id:'egg-rice-porridge',en:'Egg Rice Porridge',zh:'鸡蛋粥',
    minutes:35,meal:['breakfast'],category:'porridge',icon:'🥣',
    ingredients:[['rice',100],['egg',2],['water',null]],
    stepsEn:['Rinse 100 g dry rice and simmer in water, stirring occasionally until soft and porridge-like.','Beat the eggs; slowly pour them into the simmering porridge while stirring.','Cook until the egg is completely set and serve warm.'],
    stepsZh:['洗净100克生米，加水慢煮成粥，期间不时搅动。','鸡蛋打散，边搅边慢慢倒入微沸的粥里。','继续煮至鸡蛋完全凝固，趁温热食用。']
  },
  {
    id:'carrot-egg-pancakes',en:'Carrot & Egg Pancakes',zh:'胡萝卜鸡蛋饼',
    minutes:20,meal:['breakfast'],category:'breakfast',icon:'🥕',
    ingredients:[['carrot',1],['egg',2],['flour',null],['oil',null]],
    stepsEn:['Finely grate the carrot and mix with beaten eggs.','Stir in enough flour and water to form a spoonable batter.','Cook small pancakes in a lightly oiled pan on both sides until fully set.'],
    stepsZh:['胡萝卜擦细丝，和打散的鸡蛋拌匀。','加入适量面粉和水，搅成可舀起的面糊。','平底锅刷少量油，两面煎至完全熟透。']
  },
  {
    id:'mushroom-egg-soup',en:'Mushroom Egg Drop Soup',zh:'蘑菇蛋花汤',
    minutes:15,meal:['breakfast','lunch','dinner'],category:'soup',icon:'🍄',
    ingredients:[['mushroom',4],['egg',2],['water',null]],
    stepsEn:['Clean and slice the mushrooms.','Simmer the mushrooms in water until cooked.','Drizzle in beaten eggs and continue heating until the egg is fully set.'],
    stepsZh:['蘑菇洗净切片。','加水煮至蘑菇熟透。','慢慢淋入蛋液，继续加热至蛋花完全凝固。']
  },
  {
    id:'onion-scrambled-eggs',en:'Onion Scrambled Eggs',zh:'洋葱炒鸡蛋',
    minutes:15,meal:['lunch','dinner'],category:'stir-fry',icon:'🧅',
    ingredients:[['onion',1],['egg',3],['oil',null]],
    stepsEn:['Slice the onion and beat the eggs.','Cook the eggs in a lightly oiled pan until set; remove.','Sauté onion until soft, return the eggs, and mix briefly.'],
    stepsZh:['洋葱切丝，鸡蛋打散。','锅里用少量油把鸡蛋炒熟，先盛出。','炒软洋葱，倒回鸡蛋翻匀即可。']
  },
  {
    id:'tomato-potato-soup',en:'Tomato & Potato Soup',zh:'番茄土豆汤',
    minutes:25,meal:['lunch','dinner'],category:'soup',icon:'🍅',
    ingredients:[['tomato',2],['potato',2],['water',null]],
    stepsEn:['Wash and cut the tomatoes; peel and dice the potatoes.','Simmer potatoes in water until nearly tender.','Add the tomatoes and cook until all vegetables are soft.'],
    stepsZh:['番茄洗净切块，土豆去皮切丁。','土豆加水煮到基本变软。','加入番茄，继续煮到食材熟软即可。']
  },
  {
    id:'potato-carrot-stir-fry',en:'Shredded Potato & Carrot',zh:'清炒土豆胡萝卜丝',
    minutes:20,meal:['lunch','dinner'],category:'stir-fry',icon:'🥔',
    ingredients:[['potato',2],['carrot',1],['oil',null]],
    stepsEn:['Peel and cut potatoes and carrot into fine matchsticks.','Rinse shredded potatoes briefly and drain.','Stir-fry with a little oil until cooked through and lightly crisp.'],
    stepsZh:['土豆和胡萝卜去皮切细丝。','土豆丝简单冲洗并沥水。','锅里放少量油，炒至食材熟透且略带脆感。']
  },
  {
    id:'mushroom-bokchoy',en:'Bok Choy with Mushrooms',zh:'香菇小白菜',
    minutes:15,meal:['lunch','dinner'],category:'vegetable',icon:'🥬',
    ingredients:[['bokchoy',1],['mushroom',4],['oil',null]],
    stepsEn:['Wash the bok choy and cut mushrooms into slices.','Cook mushrooms in a lightly oiled pan until tender.','Add bok choy and stir-fry until the stems are cooked.'],
    stepsZh:['小白菜洗净，蘑菇切片。','锅里放少量油，先炒软蘑菇。','加入小白菜翻炒，直到菜梗熟透。']
  },
  {
    id:'chicken-potato-stew',en:'Chicken & Potato Stew',zh:'土豆炖鸡',
    minutes:40,meal:['lunch','dinner'],category:'stew',icon:'🍲',
    ingredients:[['chicken',300],['potato',2],['carrot',1],['water',null]],
    stepsEn:['Cut chicken and vegetables into bite-size pieces, keeping raw chicken separate.','Cook chicken in a pot, then add potatoes, carrot and enough water.','Cover and simmer until the chicken is thoroughly cooked and vegetables are tender.'],
    stepsZh:['鸡肉和蔬菜分别切块，生鸡肉与蔬菜分开处理。','先把鸡肉炒至变色，加入土豆、胡萝卜和适量水。','盖锅炖到鸡肉完全熟透、蔬菜变软。']
  },
  {
    id:'tomato-fish-soup',en:'Tomato Fish Fillet Soup',zh:'番茄鱼片汤',
    minutes:25,meal:['lunch','dinner'],category:'soup',icon:'🐟',
    ingredients:[['fish',250],['tomato',2],['water',null],['ginger',null]],
    stepsEn:['Slice the tomatoes and prepare boneless fish fillets.','Simmer tomatoes with water until softened; add ginger if available.','Add fish and cook gently until opaque, flaky and thoroughly cooked.'],
    stepsZh:['番茄切块，准备去骨鱼片。','番茄加水煮软，家里有姜可以放少许。','放入鱼片小火煮至鱼肉变色、易分层且完全熟透。']
  },
  {
    id:'carrot-egg-fried-rice',en:'Carrot & Egg Fried Rice',zh:'胡萝卜鸡蛋炒饭',
    minutes:40,meal:['lunch','dinner'],category:'rice',icon:'🍚',
    ingredients:[['rice',150],['egg',2],['carrot',1],['oil',null]],
    stepsEn:['Cook 150 g dry rice and cool it promptly before frying, or use properly refrigerated cooked rice.','Dice the carrot and scramble the eggs until set.','Stir-fry the carrot and rice until piping hot, then fold in the cooked eggs.'],
    stepsZh:['煮熟150克生米后迅速降温备用，或使用已正确冷藏的熟米饭。','胡萝卜切小丁，鸡蛋先炒熟。','把胡萝卜和米饭炒至充分热透，再加入鸡蛋翻匀。']
  },
  {
    id:'chicken-carrot-rice',en:'Chicken & Carrot Rice Bowl',zh:'胡萝卜鸡肉饭',
    minutes:35,meal:['lunch','dinner'],category:'rice',icon:'🍗',
    ingredients:[['chicken',250],['carrot',2],['rice',150],['water',null]],
    stepsEn:['Rinse and cook 150 g dry rice as instructed on the package.','Dice carrots and chicken using separate preparation surfaces.','Cook chicken thoroughly with carrot, then serve over the rice.'],
    stepsZh:['洗净150克生米，按包装说明煮熟。','胡萝卜和鸡肉分别切小块，生熟食材分开处理。','把鸡肉彻底炒熟，加入胡萝卜炒熟后配米饭食用。']
  }
]);
