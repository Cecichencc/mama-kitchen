# Kitchen Garden — Chinese Home-Cooking Library v1.1

**Status:** Development-only; not published to v0/production.
**Baseline:** Recipe Matching v2 + Kitchen Garden Design System v2.
**Audience:** Two-person home kitchen. **Purpose:** Practical recipe ideas from recorded groceries, not medical or calorie prescriptions.

## Scope

The curated catalogue now contains **19 recipes**, including **11 additional bilingual home-style dishes**. Each new dish has:
- Stable recipe ID, English/Simplified Chinese name and instructions.
- Approximate preparation time, meal type and category.
- Initial ingredient amounts for two people where units are defined.
- A reusable code-generated 320×240 flat SVG illustration composed from shared ingredients and cream tableware.
- Availability checked by the existing deterministic matcher; no generative recipe inference or live image creation.

## New recipes

| Recipe ID | 中文 | English | Key recorded quantities (initial example for 2) | Other ingredients requiring confirmation |
| --- | --- | --- | --- | --- |
| egg-rice-porridge | 鸡蛋粥 | Egg Rice Porridge | 100 g dry rice, 2 eggs | Water |
| carrot-egg-pancakes | 胡萝卜鸡蛋饼 | Carrot & Egg Pancakes | 1 carrot, 2 eggs | Flour, oil |
| mushroom-egg-soup | 蘑菇蛋花汤 | Mushroom Egg Drop Soup | 4 mushrooms, 2 eggs | Water |
| onion-scrambled-eggs | 洋葱炒鸡蛋 | Onion Scrambled Eggs | 1 onion, 3 eggs | Oil |
| tomato-potato-soup | 番茄土豆汤 | Tomato & Potato Soup | 2 tomatoes, 2 potatoes | Water |
| potato-carrot-stir-fry | 清炒土豆胡萝卜丝 | Shredded Potato & Carrot | 2 potatoes, 1 carrot | Oil |
| mushroom-bokchoy | 香菇小白菜 | Bok Choy with Mushrooms | 1 bunch bok choy, 4 mushrooms | Oil |
| chicken-potato-stew | 土豆炖鸡 | Chicken & Potato Stew | 300 g chicken, 2 potatoes, 1 carrot | Water |
| tomato-fish-soup | 番茄鱼片汤 | Tomato Fish Fillet Soup | 250 g fish, 2 tomatoes | Water, ginger (optional) |
| carrot-egg-fried-rice | 胡萝卜鸡蛋炒饭 | Carrot & Egg Fried Rice | 150 g dry rice, 2 eggs, 1 carrot | Oil |
| chicken-carrot-rice | 胡萝卜鸡肉饭 | Chicken & Carrot Rice Bowl | 250 g chicken, 2 carrots, 150 g dry rice | Water |

**Recipe estimates:** Cooking durations and ingredient quantities are provisional recipe-editor choices. Rice is always measured dry, protein in grams, egg/vegetables in whole pieces or bunches. Large variation in a 'bunch' or whole pumpkin means precise serving or nutrition calculations are **not supported**. No automatic conversions between garlic bulbs/cloves, cooked/dry rice, fish/salmon, etc.

## Source locations

- `public/phase0/home-recipes.js`: new data; kept separate from initial `recipes.js` catalogue for maintainability.
- `public/phase0/recipes.js`: catalogue composition, ingredient labels and `formatRecipeQuantity`.
- `public/phase0/recipe-art.js`: ingredient geometry and SVG recipe art mapping.
- `public/phase0/recipe-discovery.js`: uses the same SVG on recipe cards and details; now shows input units such as **150 g** and **1 bunch**.
- `public/phase0/recipe-matching.js`: authoritative tracked/untracked ingredient determination.
- `tests/home-recipe-library.test.mjs`: uniqueness, bilingual steps, SVG coverage, base-unit matching, no stock deduction.

## Critical product guardrails

1. A recipe is **confirmed feasible only** when every required ingredient has a known, quantified and sufficient recorded batch; unknown amounts remain explicitly **Verify**.
2. Water, flour and ginger do not have tracked quantities yet; users check them manually.
3. Merely browsing, saving or swapping recipes must never reserve/deduct physical groceries.
4. The three-meal planner should display distinct dishes and avoid over-allocating tracked stock within a suggested plan. These are suggestions, not reserved meals.
5. Respect batch-level organic/non-organic sourcing labels; never silently claim a mixed dish is fully organic.
6. Do not infer nutritional adequacy, recommended calories or medical dietary requirements from household body measurements.
7. Preserve the approved Three.js farm, flat SVG design system, green/cream UI and bilingual UI.

## QA / release gates

- [ ] Existing and new Node tests pass; Vite build succeeds.
- [ ] All **19** recipe IDs have an SVG image mapping; no missing binary files.
- [ ] Recipe details show units and Chinese labels accurately.
- [ ] Recipe matching doesn't mistake unknown flour/ginger/water for recorded stock.
- [ ] Three-meal planning remains distinct and stock remains unchanged.
- [ ] Review at 320 / 375 / 390 / 430px and physical iPhone Safari.
- [ ] No v0/production promotion until requested explicitly.

## Next candidate improvements

- Move ingredient requirements to a richer model with optional-versus-essential ingredients and batch sourcing rules.
- Validate cooking steps and quantities with the household; expand Pantry to beans, tofu, greens, noodles and spices using explicit units.
- Add favourites and recent-meal diversity across multiple days.
- Improve recipe selection based on actual food preferences and preparation equipment.
