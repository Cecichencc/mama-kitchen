# Kitchen Garden — Product Requirements Document (PRD)

> **Version:** 1.0 · **Date:** 2026-10-08  
> **Status:** Draft for product and interface exploration; **not approval to code**  
> **Product:** Kitchen Garden / 厨房小农场  
> **Platform:** Mobile-first, installable 3D web application (PWA); iPhone Safari first  
> **Primary language:** Simplified Chinese (zh-CN); English-ready content structure  
> **Household timezone:** Asia/Singapore  
> **Related specifications:** `KITCHEN_GARDEN_GAME_LOGIC.md` and `KITCHEN_GARDEN_3D_BUILD_PLAN.md`

---

## 1. Executive summary

Kitchen Garden is a **real-inventory-powered 3D farming game** that helps a two-person household decide what to cook and eat for breakfast, lunch, and dinner. The user's actual groceries appear as harvestable resources in a miniature clay-style farm. Harvesting fills a virtual basket; a meal-planning system uses the basket or available stock to suggest practical, varied home-cooked meals. Cooking confirmation updates the real inventory.

The game is not a virtual farming simulator where waiting generates food. **No virtual growth produces real-world stock.** “Regrowth” is a delightful visual representation of inventory that still remains available after a harvest.

The first priority is a **working HTTPS playable experience**, not another static mockup or local-only HTML file. The product should be pleasant enough to explore but simple enough that a parent can decide what to cook within a minute.

### 1.1 One-sentence product promise

**打开农场，收获家里的食材，轻松决定今天吃什么。**  
Open your farm, harvest food you already own, and decide what to eat with less effort.

### 1.2 Product principles

1. **Game first, utility underneath.** The farm should feel like an explorable 3D toy world, not an ingredient spreadsheet decorated as a farm.
2. **Reduce decisions, never add chores.** “帮我决定” produces one clear recommendation per meal; users may reroll or manually choose.
3. **Real inventory is the truth.** A crop animation never creates, deletes, or consumes physical groceries by itself.
4. **Two people, one kitchen.** Dishes can be shared while portions and ingredient sourcing remain person-specific.
5. **Healthy without punishment.** Support adequate, varied meals, not calorie restriction, diet scoring, shame, or forced gamification.
6. **Human-confirmed actions.** Groceries, prepared food, food actually eaten, leftovers, and corrections remain explicit and reversible where possible.
7. **Accessible on a phone.** Chinese labels, large tap targets, accessible non-3D alternative interactions, and graceful WebGL fallback.

---

## 2. Problem, audience, and opportunity

### 2.1 Core user problem

The household often has ingredients in the fridge, freezer, and pantry, but Mom doesn't know **which combination to cook**. Repeatedly deciding three meals each day is tiring. Recipe search is too open-ended, and choosing a recipe that needs additional groceries defeats the purpose of using what's at home.

### 2.2 Primary and secondary users

| User | Context | What they need |
|---|---|---|
| **Mom** (primary daily player) | Typically prepares or helps decide family meals; comfortable with familiar home-style dishes; often unsure what to make | One-tap meal ideas, easy harvest, simple inventory correction, clear recipe steps, readable Chinese UI |
| **Daughter** (co-player/household admin) | Shares ingredients and meals, is more likely to maintain preferences and setup | Ability to mark organic stock, manage sourcing/portions, see inventory, explore or override recommendations |

**Confirmed household starting information:** Daughter: 162 cm / 46 kg, organic *preferred*. Mom: 167 cm / 46 kg, non-organic permitted. The same dish is the usual default for both women, with editable personal portions or separate sourcing/preparation when required. Measurements are optional profile fields and must **not** be used alone to calculate a medical nutrition prescription.

### 2.3 Jobs to be done

- **When I have groceries but no meal idea,** suggest what I can actually cook without a lengthy search.
- **When I want to choose myself,** let me harvest ingredients and discover compatible dishes.
- **When I buy or use groceries,** make it easy to keep the farm up to date.
- **When we eat the same meal,** keep each person's sourcing, portion, and food record accurate.
- **When I return tomorrow,** remember what we cooked and suggest variety where the inventory allows.

### 2.4 Outcomes and initial success measures

These are **pilot targets**, not demonstrated results:

| Outcome | Proposed measurement / target |
|---|---|
| Make meal decisions easier | Median time from tapping `帮我决定` to accepting a feasible meal idea **≤ 60 seconds** during family pilot |
| Make the game actually playable | Hosted HTTPS 3D scene loads and a harvest tap works on the target iPhone Safari |
| Prevent invisible stock mistakes | **0 unconfirmed or duplicate physical-stock deductions** in automated invariant tests |
| Support realistic meals | Every suggested meal indicates whether it can be made entirely from current usable stock; no invented quantities |
| Support variety | For sufficient stock/recipe choices, three different meals per day; avoid exact-dish repeats in recent seven days when feasible |
| Keep daily effort small | Inventory edit should usually take a few taps, not require scanning or filling a long form |
| Enjoyable for Mom | After a seven-day household pilot, gather a simple “Would you keep using this?” response and friction notes |

---

## 3. Product scope and releases

### 3.1 First **playable vertical slice** (P0 proof of concept)

The first hosted version must demonstrate an end-to-end working game loop using **tomatoes and eggs**:

- A **true 3D**, raised grassy clay island with a tomato plot, chicken coop, simple barn and harvest basket.
- Orthographic/isometric camera, accessible tap targets, small playful harvest animation.
- Manual stock entry with quantities, units, and organic/non-organic/unknown source.
- Crop tap → reserve stock → basket → visual empty/regrowth or out-of-stock state.
- One two-person recipe, `番茄炒蛋`, with editable actual ingredient amounts.
- Confirm cooking → deduct exact ingredients once → show updated inventory and farm.
- A publicly reachable or appropriately access-controlled **HTTPS preview URL** that opens in iPhone Safari; readable WebGL fallback.
- Persistence for the prototype session, with a clear disclosure that cloud sharing arrives in the next release.

**Vertical-slice exit example:** Add six tomatoes and eight eggs → harvest two tomatoes and three eggs → cook → physical stock becomes four tomatoes and five eggs. Cancelled harvests and repeated submit actions must not affect quantities incorrectly.

### 3.2 **Family beta / product v1** (P0 for practical household use)

- Shared, authenticated household inventory synced across Mom and Daughter devices.
- Five accessible 3D farm areas and representative ingredient catalogue (~40–60 foods to start).
- Both meal creation modes: `自己选` and `帮我决定`.
- Three-meal daily plan for two, recipe previews, reroll/swap, and an initial curated recipe library (~30–40 recipes).
- Batch-level organic source and storage/date handling.
- Accurate cooking, actual eating, leftovers, eating out, and manual stock corrections.
- Chinese-first UI, installable PWA, basic resilience/accessibility and seven-day pilot.

### 3.3 Explicitly **later** (out of initial v1)

AI fridge/photo recognition; receipt parsing; voice-based inventory updates; open-ended generative recipes without validation; complicated crop timers; in-app shopping or retailer integration; multiplayer avatars; currency, ads, leaderboards; medical nutrition prescriptions; 3D character locomotion as a prerequisite to cooking.

---

## 4. Game world and interaction model

### 4.1 Five farm areas

The areas are **game navigation locations**, not exclusive nutrition classifications (a food may have several nutrients).

| Area | Chinese name | Resource examples | Playful affordance |
|---|---|---|---|
| Vegetable Garden | 蔬菜园 | Tomato, bok choy, carrot, mushrooms | Tap plump vegetables to harvest |
| Protein Barn | 蛋白农舍 | Eggs, chicken, meat, tofu, beans | Coop, barn shelves, product crates |
| Fish Pond | 小鱼塘 | Fish, shrimp and other seafood | Tap a fish resource / pond marker |
| Fruit Orchard | 水果园 | Apples, citrus, berries, banana | Tap fruit on trees or crates |
| Grain Field & Pantry | 谷物田与粮仓 | Rice, oats, noodles, potatoes, bread, oils | Collect from grain plots, pantry bins, storage |

Fish/meat/dairy/tofu should be represented playfully without misleading the user that these literally grow in vegetable plots. A sixth decorative kitchen building may be used as an entry to recipes and daily meals, but should not add a sixth core food category.

### 4.2 3D art direction

- Inspired by the user's supplied orange farm references: orange/amber background, cream rounded UI, matte low-poly/clay objects, raised grassy diorama, miniature red barn, rounded trees, simple friendly farmer/chef.
- Real geometry built with Three.js/React Three Fiber, with procedural blocks at first and polished GLB assets later. **Do not present static concept images as the playable farm.**
- Fixed elevated orthographic camera (isometric-like), limited pan and zoom; select a zone to focus; always provide a `返回农场` action.
- Tap/click crops or an equivalent list control; no drag, movement joystick, free camera rotation, or precision gestures required in v1.
- On successful harvest: object bounces/plucks → item travels into basket → plot temporarily empties → if unreserved stock remains, a new visual crop appears.
- Matte lighting, gentle animation, optional sound, reduced-motion controls; minimum ~44×44 CSS px controls in the HTML interface.

### 4.3 Game progression

Rewards are gentle and non-punitive: celebrate using existing ingredients, discovering dishes, and varied eating. Optional future cosmetic unlocks can decorate the farm; never require daily streaks or points to access meal planning, and never encourage eating unsafe food to earn points.

---

## 5. Core user journeys

### UJ-01 — First-time setup and grocery entry

1. Open the hosted app and choose or join the family household.
2. See a short farm introduction explaining that crops represent real food at home.
3. Select `添加食材`; pick ingredient, quantity/unit, organic status, and storage; optional purchase or date information.
4. Confirm → physical inventory increases → corresponding 3D resource becomes harvestable.
5. Show a simple confirmation with `继续添加` or `回到农场`.

**No camera/photo permission required in v1.** Unknown sourcing must remain explicitly unknown, not silently classified organic.

### UJ-02 — Mom wants to choose ingredients herself

1. Open `农场` and select an area or tap an available crop.
2. Set quantity and, when needed, batch/source (`有机`, `非有机`, `未标注`).
3. Tap `收获` → reserve stock, animate ingredient to basket.
4. Repeat, or select only one anchor ingredient.
5. Open `收获篮` → `用这些做饭`.
6. See 1–3 feasible recipes/meal combinations with time, ingredient amounts, source and missing items clearly indicated.
7. Accept and start cooking; no physical deduction yet.

### UJ-03 — Mom cannot decide

1. Open `今日厨房` → `帮我决定`.
2. App considers usable stock, organic preferences, both users, recent meals and cooking effort.
3. Show a **coherent three-meal plan**: `早餐`, `午餐`, `晚餐`.
4. Each card offers `就吃这个`, `换一道`, `查看做法` or an ingredient substitution where feasible.
5. If one slot is rerolled, other slots retain their accepted choices when possible; the planner rechecks all day's resource allocations.
6. Accept one or all meals without consuming stock; cooking confirmation happens later.

### UJ-04 — Cook and record what really happened

1. From basket or daily plan, tap `开始做饭`.
2. Check recipe, source batches, actual quantities used and expected yield for two.
3. Adjust to reflect real cooking; handle any organic-preference exception explicitly.
4. Tap `我做好了` → validated **one-time** stock deduction and cooking session creation.
5. Optionally record `我们吃了多少？` for each person and save remaining cooked portions as leftovers, or `稍后再记`.
6. Return to farm; visible crops reflect newly available amounts.

### UJ-05 — Real-life inventory is different

From `库存`, a user can `增加`, `减少`, `用完了`, `单独用了`, `丢弃` or correct a quantity with reason. If a correction conflicts with someone else's basket reservation, the app must explain the issue and offer a safe resolution rather than silently allowing a negative balance.

### UJ-06 — Special meal situations

- `在外面吃了`: mark a meal slot complete without reducing household raw ingredients.
- `吃剩菜`: use a prepared-food leftover batch, not fresh raw stock.
- `自己吃了别的`: optionally record an independent meal/consumption without forcing the shared recommendation.
- `今天不做`: dismiss a plan without penalty or raw stock changes.

---

## 6. Functional requirements

Priority legend: **P0** = mandatory for named release, **P1** = quality enhancement, **Later** = deferred.

| ID | Requirement | Priority / release | Acceptance criteria |
|---|---|---|---|
| FR-01 | Actual 3D farm, mobile tap/pan/zone focus | P0 slice | A tomato mesh responds to touch in iPhone Safari; accessible text alternative works |
| FR-02 | Ingredient catalogue and five farm zones | P0 beta | Each ingredient has a correct location and usable stock unit |
| FR-03 | Manual grocery intake | P0 slice | Quantity, unit, source and storage saved; stock increases exactly once |
| FR-04 | Batch-level inventory | P0 beta | Two organic statuses / purchase batches of tomato do not merge silently |
| FR-05 | Harvest reservation and basket | P0 slice | Harvest affects availability but **not on-hand** stock; cancel releases reservation |
| FR-06 | Crop empty/regrowth/blocked states | P0 slice | Available >0 regrows cosmetically; available =0 stays empty; blocked has explanation |
| FR-07 | Actual cooking deduction | P0 slice | Real used amounts deducted atomically once; double-tap/retry cannot double-deduct |
| FR-08 | Inventory corrections and audit history | P0 beta | No negative stock; cause and amount recorded; safe corrections reversible |
| FR-09 | Household sharing and sync | P0 beta | Two accounts see same stock and cannot both reserve the same last unit |
| FR-10 | Manual choose-food mode | P0 beta | Selected basket ingredients anchor feasible recipe suggestions |
| FR-11 | Automatic daily plan | P0 beta | Three meal slots planned jointly without promising stock twice |
| FR-12 | Variety and recipe swap | P0 beta | No same dish in two slots in one day when alternatives exist; seven-day repetition discouraged |
| FR-13 | Person profiles and organic preference | P0 beta | Organic preferred for Daughter; explicit exception; mixed-pot disclosure honest |
| FR-14 | Same meal, different portions | P0 beta | Shared recipe can produce editable separate serving records |
| FR-15 | Cooked vs eaten vs leftovers | P0 beta | Consumption doesn't deduct raw stock twice; prepared leftovers tracked separately |
| FR-16 | Missing ingredient & out-of-stock flows | P0 beta | App never falsely asserts that missing stock is available; restock action shown |
| FR-17 | Chinese-first mobile interface | P0 slice | Core controls in zh-CN, large targets and legible contrast |
| FR-18 | PWA installability and safe reconnect | P0 beta | App can be opened from mobile home screen; reconnection doesn't repeat writes |
| FR-19 | Reduced motion / WebGL fallback | P0 slice | Meal and stock actions remain possible without 3D rendering |
| FR-20 | Photo, receipt, voice import | Later | Any recognized change requires human review before committing |

---

## 7. Inventory, harvest, and cooking rules

**Authoritative accounting:**

```text
on_hand = amount physically recorded at home
reserved = amount held in active harvest baskets
available = max(0, on_hand − reserved)
```

| Player action | Physical `on_hand` | Basket reservation | Farm presentation |
|---|---:|---:|---|
| Buy 6 tomatoes | +6 | 0 | Tomatoes appear |
| Harvest 2 tomatoes | no change | +2 | Crop plucks; regrows if available > 0 |
| Cancel basket item | no change | −2 | Resource returns to ready state |
| Confirm cook with 2 tomatoes | −2 | Used hold released/consumed | Visual resource matches remaining availability |
| Eat cooked serving | no change | no change | Meal history/leftovers update |
| Mark one unused tomato thrown away | −1 | no change | Available stock and resource update |
| `用完了` | Set **validated unreserved** stock to zero (or resolve holds) | conflict aware | Empty plot / `需要补货` |

### 7.1 Regrowth state machine

```text
READY → (tap) HARVESTING → (reservation confirmed) EMPTY
                                      ├─ available > 0 → REGROWING → READY
                                      └─ available = 0 → OUT_OF_STOCK
OUT_OF_STOCK → (restock/valid correction) → REGROWING → READY
HARVESTING → (error/conflict) → READY or BLOCKED, with explanation
```

- Regrowth is **cosmetic**, ideally ~0.7–1.5 seconds, not based on real growth time.
- The amount displayed in inventory must not be confused with visually rendered crop count. A cluster can represent several units.
- Baskets may expire after inactivity (proposed default **30 minutes**, to validate in pilot), releasing their reservations.
- Cooking and reservations should use idempotency keys and server transactions once cloud sync is introduced.
- Use-by and best-before are distinct. Decorative maturity never guarantees food safety. Past use-by items must not be suggested/reserved automatically without a safe resolution workflow.

---

## 8. Meal planning, personalisation, and health

### 8.1 Household rules

- Usually recommend the **same recipes** for both members, but portion amounts are individually editable.
- Daughter's organic preference is **strong but not absolute**; select verified organic batches first, and require explicit confirmation to use non-organic/unknown source for her.
- Mom can use either source. If one pot combines differently sourced batches, the resulting shared dish **cannot** be labelled fully organic. Offer separate preparation when possible.
- Allergies, ingredient exclusions and clinician-given dietary restrictions—if supplied—override preferences and recipe variety.

### 8.2 Nutrition approach

- Use **broad healthy-meal heuristics**: variety across vegetables and fruit, appropriate protein sources, carbohydrates (prefer wholegrains when suitable), and fats over the day. The five farm areas are *not* one-to-one nutrient groups.
- Do not prescribe calories, protein targets, weight loss, or dietary restrictions from height and weight alone. If either person has clinical nutrition requirements, allow clinician-provided settings and encourage appropriate professional advice.
- Support optional snacks and personal portion adjustments. The system should not pressure either member to eat too little.

### 8.3 Recommendations and variety

**Hard checks before recommendations:** usable batch amounts, compatible units, food safety/date restrictions, allergy/exclusion settings, sourcing disclosures and necessary cooking ingredients.

**Soft ranking:** variety over recent seven days, use-soon *safe* food, familiar recipes, cook time, preparation effort, liking history, mixed-dish suitability and food-group diversity.

The system should **plan all three slots together**, simulate stock allocation, and avoid repeating a recipe within a day. Aim for different dishes across days when possible, without inventing groceries or hiding unavoidable repetition when stock is limited. A reroll must preserve the other accepted meals when feasible and transparently flag any conflict.

**MVP algorithm:** curated recipe templates and deterministic feasibility/ranking. AI can assist with language, variations, or recognition later, but must not invent unverified nutrition data, stock, or unvalidated ingredient conversions.

### 8.4 What one meal card shows

- Meal slot and title (`早餐 / 午餐 / 晚餐`), one clear recommendation, cook time and difficulty.
- `两人份` by default with editable portions; sourced organic preference warning when applicable.
- Ingredients available, exact amounts, any missing ingredient and a `查看做法` action.
- `换一道` and `就吃这个` controls; cooking requires a later explicit confirmation.
- Option to build a meal from one chosen farm ingredient (`用这条鱼帮我想`).

---

## 9. Screen inventory and navigation

| Screen / location | Primary role | Key actions |
|---|---|---|
| `农场` (home) | See living 3D inventory; primary playful entry | Explore zone, tap ingredient, harvest, basket |
| `区域聚焦` | Explore selected zone with larger targets | Harvest, view quantity/source, return to farm |
| `收获篮` | Review reservations for potential dishes | Adjust/remove, `用这些做饭`, clear basket |
| `今日厨房` | Breakfast, lunch, dinner for two | `帮我决定`, choose, swap, view recipe, start cooking |
| `烹饪详情` | Confirm exact preparation and actual usage | Edit amounts and sources, `我做好了` |
| `用餐记录` | Actual eating and leftovers | Record per member, save leftover, ate out |
| `食材库存` | The reliable stock list behind the farm | Add, correct, use up, discard, inspect batches |
| `家庭设置` | Preferences, accessibility and household members | Organic preference, allergies, portions, language |

**Suggested bottom navigation for mobile:** `农场` · `今日三餐` · `库存`. The harvest basket should be an always-visible icon/badge in the farm header; `添加食材` is accessible from the farm and inventory screens. Avoid a five-tab dashboard in the first interactive 3D slice.

**Core copy examples:**

- `今天想吃什么？` · `我想自己选` · `帮我决定`
- `轻点食材来收获` · `收获成功！` · `收获篮（2）`
- `库存还剩 4 个` · `暂时没有库存` · `去补货`
- `用这些做饭` · `换一道` · `查看做法` · `开始做饭`
- `实际用了多少？` · `我做好了` · `我们吃了多少？` · `稍后再记`
- `有机优先` · `此菜使用了非有机食材，是否继续？`

---

## 10. Conceptual data entities

The game UI is a derived view over a trusted household domain model. This is a **conceptual PRD model**; field-level schema belongs in the companion logic spec.

1. **Household / HouseholdMember** — household membership, roles, timezone.
2. **MemberProfile** — editable preferences, portion defaults, organic sourcing, allergies/restrictions, optional measurements.
3. **Ingredient** — Chinese/English name, farm area, base unit, tags, GLB asset mapping.
4. **InventoryBatch** — ingredient, actual on-hand amount, storage, purchase/use-by/best-before dates and organic status.
5. **StockMovement** — immutable add/use/discard/correction ledger with actor, reason and idempotency key.
6. **HarvestBasket / BasketHold** — per-person tentative reservations with expiry and batch/quantity.
7. **Recipe / RecipeIngredient** — validated servings, steps, slots, ingredients and quantities.
8. **DailyMealPlan / PlannedMeal** — date, slot, recipe, allocation preview, status, accepted vs suggested state.
9. **CookingSession / UsedIngredient** — actual quantities used, source batches and prepared yield.
10. **ConsumptionRecord / LeftoverBatch** — member portions eaten and prepared food remaining.
11. **FarmPresentationState** — derived ready/empty/regrowing/blocked states; **never** the source of quantity truth.

**Cross-device requirement:** users outside a household cannot read or change its records; simultaneous edits must never allow negative inventory or duplicate deductions.

---

## 11. Non-functional requirements and risks

### 11.1 Accessibility, reliability and compatibility

- iPhone Safari first, Android Chrome and desktop secondary; usable at **320 px** width and common phone sizes.
- Touch targets approximately **44×44 CSS px** or more; avoid hover-only actions, small text on 3D terrain and mandatory gesture precision.
- All essential actions accessible through labelled HTML UI if WebGL is unavailable or reduced motion is requested.
- Game state should survive app reload after server persistence is integrated, without replaying stock changes.
- Aim initially for a smooth ~30 fps on the target phone; simplify assets rather than sacrificing input clarity. Validate actual hardware instead of promising a frame rate in the PRD.
- Require a real HTTPS link for user acceptance; a downloadable HTML file is insufficient evidence that the 3D web game is playable on Mom's device.

### 11.2 Privacy and product safety

- Health-related preferences/restrictions are private household data; minimise collection and avoid including sensitive values in analytics events.
- Organic is a sourcing preference, not a medical or safety claim.
- The app should not auto-decide that past-use-by or improperly stored food is safe; show clear human-readable warnings and allow appropriate discard/correction actions.
- Simple user-visible event history and undo/correction flow build trust in shared inventory.
- `帮我决定` must always have a no-feasible-recipe fallback, such as partial plan, honest substitution or grocery-list gap.

### 11.3 Principal risks and mitigations

| Risk | Mitigation |
|---|---|
| Another beautiful demo that isn't playable | Hosted, tested 3D proof first; use real geometry and phone-browser checks |
| Inventory drifts from real life | Fast manual corrections, explicit cook confirmation, audit log, periodic gentle reconciliation |
| Farm interactions feel like extra chores | Always offer immediate `帮我决定` and text-only ingredient list |
| Mixed organic/non-organic food mislabelled | Batch-level provenance and whole-pot disclosure |
| Two people reserve the same last ingredient | Server transactions, active reservations, idempotent commands |
| Too many complicated food choices | One primary suggestion per meal, limited swaps, familiar recipe library |
| Inaccurate recipe feasibility/nutrition | Curated recipes, verified units, honest missing ingredients, personalised clinician guidance when appropriate |
| 3D runs poorly on iPhone | Low-poly GLB, limited effects, lazy loading, HTML fallback, physical device testing |

---

## 12. Delivery plan and exit gates

| Phase | Deliverable | Gate before next phase |
|---|---|---|
| **0 — Hosted WebGL proof** | HTTPS 3D scene with tappable tomato, camera and fallback | It opens and responds to touch on physical iPhone Safari |
| **1 — Playable mini-farm** | Clay island, barn, tomatoes, eggs, harvest/basket, cook one recipe | Add 6+8 → reserve 2+3 → confirm cook → remaining 4+5; cancelled actions safe |
| **2 — Shared inventory** | Supabase household accounts, batch/organic logic, stock edits and two-phone sync | Last-item concurrency test and correction tests pass |
| **3 — Five-area farm** | Vegetable, protein, fish, fruit, grain/pantry areas and stocked 3D objects | Every area has functional resource interaction and out-of-stock states |
| **4 — Today's Kitchen** | 3 shared meals, choose/self, reroll, portions, eating/leftovers, meal history | No double-promised stock; practical 3-meal plan for two people |
| **5 — Family beta** | Polished visual system, PWA, accessibility/performance, seven-day pilot | Family confirms usability, accurate stock and reduced decision friction |

**Order of work:** do not start large-scale models or free-form AI meal generation before a working hosted 3D harvest-to-cook loop has passed acceptance.

---

## 13. Acceptance scenarios for sign-off

- **AC-01:** Add six organic tomatoes and eight eggs; show them in the farm, with correct stock badges.
- **AC-02:** Harvest two tomatoes and three eggs; reserve without physically deducting. Available becomes four and five while on-hand remains six and eight.
- **AC-03:** Cancel basket → availability returns to six and eight; no physical stock changes.
- **AC-04:** Harvest again and confirm `番茄炒蛋` using two tomatoes and three eggs → on-hand becomes four and five exactly once.
- **AC-05:** Repeated `我做好了` or a reconnect must not double-deduct ingredients.
- **AC-06:** Harvest last available tomato → plot stays empty with `暂时没有库存`; adding a tomato triggers regrowth.
- **AC-07:** Correct quantity downward and `用完了`; active holds resolved without silent negative stock.
- **AC-08:** Organic and non-organic tomatoes remain distinct batches and show honest mixed-pot warnings.
- **AC-09:** On separate devices, two users cannot both reserve the same last unit of food.
- **AC-10:** `帮我决定` makes a three-slot plan when feasible without allocating the same ingredients twice; reroll one slot checks feasibility again.
- **AC-11:** Mom and Daughter can record different portions from a shared cooked dish; eating does not subtract raw stock again.
- **AC-12:** A person eats outside; no fridge ingredient is deducted.
- **AC-13:** Without WebGL, the accessible text-based harvest, stock and recipe paths remain functional.
- **AC-14:** No unconfirmed photo-derived input, AI guess or crop-growth animation may modify actual stock.

---

## 14. Open questions for the **interface exploration**, not blockers to writing this PRD

| Decision to explore | Working assumption / starting point |
|---|---|
| What is the opening home screen? | **3D farm first**, with a prominent `帮我决定` shortcut to the three-meal plan |
| How large is the farm? | One miniature connected island; tap area → camera focus rather than long free-roam gameplay |
| What does the farmer look like? | Warm, stylised small human or chef helper; non-essential to first play test |
| How does harvesting feel? | Tap → pluck/squash → short arc to basket → empty → cosmetic regrowth |
| How to show a lot of food on a tiny island? | One representative interactive crop/resource per ingredient with clear numeric stock; expandable zone focus |
| Where does the cooking UI live? | HTML bottom sheet or kitchen overlay above/alongside the 3D scene, not entirely 3D text |
| How do two users appear? | Shared farm, simple person switcher for meal/portion previews; separate accounts after sync milestone |
| How much gamification? | Gentle feedback and optional decoration, no forced quests or penalties |

### Proposed next exploration sequence

1. **3D world map and camera** — shape of the island, visual proportions of five zones, central kitchen and barn.
2. **Farm home and harvest interaction** — 3D scene + tap states + basket animation + mobile HUD.
3. **Today's Kitchen and recipe details** — three meals, Mom/Daughter portions, organic indicators, cook confirmation.
4. **Inventory and correction** — minimalist bottom sheets for restock, adjust, use up and recover from errors.
5. **One prototype test** — play a real 3D tomato-to-omelette flow on iPhone Safari before modelling the whole world.

**Next step after PRD review:** interface exploration and interaction storyboard; **do not start coding or deployment yet**.

---

## 15. Source of decisions / document maintenance

This PRD consolidates the household and game decisions discussed through 2026-10-08, plus the separate existing game-logic and 3D implementation documents. The PRD states the **what and why**; `KITCHEN_GARDEN_GAME_LOGIC.md` defines the authoritative **rules and invariants**; `KITCHEN_GARDEN_3D_BUILD_PLAN.md` defines the proposed **technical approach and phased engineering sequence**.

When UI exploration changes a workflow, update this PRD first, then align the logic document and engineering plan before coding.