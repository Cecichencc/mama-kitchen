# Kitchen Garden — Game Logic & Rules

**Document:** `KITCHEN_GARDEN_GAME_LOGIC.md`  
**Version:** 2.0 (3D rebuild specification; pre-implementation)  
**Language:** Simplified Chinese UI first; English identifiers in code  
**Household timezone:** `Asia/Singapore`  
**Status:** Design contract; not an implemented 3D game

## 0. Product contract

Kitchen Garden is a **real-inventory-driven 3D farming game** for two people. The farmer harvests foods that really exist at home, uses the basket to select ingredients, and makes the household's breakfast, lunch and dinner. Game visuals are a metaphor: growing tomatoes on screen **does not create real tomatoes**.

The system must distinguish these four stages:

1. **Physical stock:** ingredients actually in the fridge, freezer or pantry.
2. **Harvested/reserved:** ingredients selected in the game's basket (not yet consumed).
3. **Cooked/prepared:** ingredients actually used to cook a meal (physical stock is deducted).
4. **Eaten/left over:** separate records for what each person ate and what food remains cooked.

**Non-negotiable invariant:** No animation, navigation or recommendation is allowed to increase or decrease physical stock without an explicit stock-changing command and validated quantity.

## 1. Household and person rules

- One shared household / farm / ingredient inventory.
- Two profiles: `daughter` (organic **preferred**, exceptions may be confirmed) and `mother` (organic or non-organic acceptable).
- Default is the **same dishes for both people**, with different editable portions and, when necessary, different stock batches or separate preparation.
- Household profile data may store height/weight optionally, but **do not derive fixed medical calorie, protein or restriction targets from height/weight alone**.
- Nutrition constraints can include clinician-specified requirements, allergies and exclusions, which take precedence over recipe variety or points.
- Organic status is **sourcing preference**, not an assertion of food safety or clinical superiority.
- A shared pot with any non-organic or unknown-sourcing ingredient must be labelled `mixed/unknown`; never describe Daughter's serving as certified organic in that case.

## 2. Ingredient taxonomy and farm locations

The five areas are a **game navigation taxonomy**, not a mutually exclusive nutrition model:

| Farm zone | Chinese UI | Example harvestables | Note |
|---|---|---|---|
| `vegetable` | 蔬菜园 | tomato, bok choy, carrot, mushrooms | Multiple micronutrient/fibre tags |
| `barn` | 蛋白农舍 | eggs, chicken, pork, tofu, beans | Dairy/alternatives may appear in pantry |
| `pond` | 小鱼塘 | fish, shrimp, seafood | Real refrigerated/frozen stock represented playfully |
| `orchard` | 水果园 | apples, oranges, berries, bananas | Fresh or frozen can have different batches |
| `grains` | 谷物田和粮仓 | rice, oats, noodles, bread, potato | Includes pantry staples and carbohydrates |

Ingredient catalogue fields:

```ts
type Ingredient = {
  id: string;
  nameZh: string;
  nameEn: string;
  farmZone: 'vegetable' | 'barn' | 'pond' | 'orchard' | 'grains';
  stockBaseUnit: 'g' | 'ml' | 'piece';
  allowedDisplayUnits: string[]; // e.g. 个, 克, 把, 包
  nutrientTags: Array<'protein'|'fibre'|'carbohydrate'|'vitamin'|'mineral'|'fat'>;
  allergyTags: string[];
  modelAssetId: string;
};
```

Food groups and nutritional tags **overlap** (e.g. beans contribute both protein and fibre). Not every food can accurately be measured as a piece: for rice, poultry, fish and partial packs, the canonical amount should be grams/millilitres, with well-defined display-unit conversions.

## 3. Batch-level inventory

Store separate physical batches even for the same ingredient when sourcing, expiry/use-by, storage location or purchase differs.

```ts
type InventoryBatch = {
  id: string;
  householdId: string;
  ingredientId: string;
  quantityOnHand: number; // precise decimal in database, not JS floating point ledger
  baseUnit: 'g' | 'ml' | 'piece';
  organicStatus: 'organic'|'nonorganic'|'unknown';
  storage: 'fridge'|'freezer'|'pantry';
  purchasedAt?: string;
  bestBefore?: string;
  useBy?: string;
  notes?: string;
  version: number;
};
```

Rules:

- `organic` must be manually selected/confirmed; unknown is **not** organic.
- Prevent negative quantities and incompatible unit arithmetic.
- Decimal precision and conversions must be defined per ingredient. `piece` can be restricted to whole integers; `g` and `ml` can be finer increments.
- `useBy` and `bestBefore` are different concepts. Never decide an ingredient is safe solely based on the decorative growth stage.
- A past `useBy` date blocks automatic recipe recommendation/reservation until resolved with an appropriate user correction/disposal flow. Do not silently reclassify as safe.
- The inventory is authoritative on the server once shared sync is introduced. Game meshes read **derived** stock, not a second copy of stock.

### 3.1 Stock arithmetic

For a physical batch `b`:

```text
on_hand(b)  = physical amount entered/remaining
reserved(b) = sum of unexpired basket holds for that batch
available(b) = max(0, on_hand(b) - reserved(b))
```

Invariant: `0 <= reserved(b) <= on_hand(b)` under all valid states.

Meal **draft plans** do not themselves reserve stock. The planner simulates allocations across three meals so it doesn't recommend using the same last piece more than once. It rechecks real stock when cooking starts / is confirmed.

### 3.2 Inventory-changing commands

| Command | Effect on `on_hand` | Notes |
|---|---:|---|
| `AddGroceries` | `+quantity` | Creates a batch and ledger movement |
| `Harvest` / `Reserve` | `0` | Adds/updates basket hold |
| `ReleaseReservation` | `0` | Frees amount for future harvest |
| `ConfirmCooked` | `-actual_used` | Atomic batch-level deduction; creates cooked meal |
| `UseOutsideGame` | `-quantity` | E.g. someone ate an egg directly |
| `DiscardStock` | `-quantity` | User records waste, with optional reason |
| `CorrectStock` | Delta to verified amount | Requires reason; must handle existing holds |
| `UndoCorrection` | Compensating delta | Audited, subject to conflict validation |
| `ConfirmEaten` | `0` raw stock | Updates cooked serving allocations / leftovers |
| `AddLeftovers` | `0` raw stock | Creates *prepared-food* batch, not original raw stock |

Do not deduct again when someone taps “ate” for food already accounted for when cooked.

## 4. 3D crop visual state machine

There is one interactive resource/plot per ingredient type (or several visual instances that share the same underlying pool). Each has an easy-to-tap interaction collider.

```text
READY --tap--> HARVESTING --reserve succeeds--> EMPTY_ANIMATING
                                               |
                        available > 0 ----------+--> REGROWING --> READY
                        available = 0 ----------+--> OUT_OF_STOCK

OUT_OF_STOCK --AddGroceries/valid correction--> REGROWING --> READY

HARVESTING --stock conflict/network failure--> READY + error feedback
```

**Regrowth is visual only.** A small crop can appear after about 0.7–1.5 seconds if the remaining `available` amount is positive. Do **not** create virtual stock, planting timers, additional produce, daily spawns, or currency in v1.

Special cases:

- `READY`: harvest button enabled and stock available.
- `USE_SOON`: visual accent on the ready crop if date metadata warrants a reminder; no claim of food safety.
- `EMPTY_ANIMATING`: plot temporarily looks bare immediately after a successful harvest.
- `REGROWING`: pop/sprout animation only; can be skipped with reduced-motion setting.
- `OUT_OF_STOCK`: empty brown plot / inactive coop or pond, label `没有库存 · 去补货`.
- `BLOCKED`: not selectable because stock is expired, reserved by someone else, or invalid; show understandable reason.

For animal/pond/pantry resources, “regrow” is a playful **restock animation** rather than literal biological growth.

### 4.1 One-tap harvest

1. User taps a tomato mesh or its visible label.
2. UI finds eligible stock batches with `available > 0`, not blocked by date rules.
3. Select default `1 piece` or a sensible editable amount for weighed food; if more than one source batch exists, show source choices.
4. Call `Reserve` with `household_id`, `member_id`, `basket_id`, `batch_id`, `quantity`, `idempotency_key`.
5. On confirmed success, animate food to basket; show basket count; plot empties and visually regrows **only if** `available > 0`.
6. If reservation fails, return to ready or stock-blocked state, show reason and keep physical stock unchanged.

Tap targets must be usable on mobile; provide an accessible DOM list with identical harvest functionality.

### 4.2 Harvest basket

- Basket lines link to **specific batches**, preserving organic status and expiry/storage info.
- User can change quantities, remove one line, clear basket or use selection for a recipe.
- Removing a line releases its hold; inventory remains unchanged.
- Auto-expire abandoned holds after a bounded idle period (initial proposal: 30 minutes). Notify on return; never present expired basket lines as available.
- Holds are shared across devices and validated under concurrent use.

## 5. Recipe and daily meal-planning logic

### 5.1 Two modes

**Manual / 自己选：** choose one or more ingredients in farm; basket → `用这些做饭` → rank realistic compatible dishes → cook or swap. The user can select only one ingredient and let the game complete the meal.

**Choose for me / 帮我决定：** inspect household stock, two-person profiles and history → produce **joint breakfast, lunch, dinner plan** → accept, reroll one slot or replace an ingredient. Do not quietly deduct stock for generated suggestions.

### 5.2 Recipe template

```ts
type Recipe = {
  id: string;
  nameZh: string;
  slots: Array<'breakfast'|'lunch'|'dinner'|'snack'>;
  baseServings: number;
  ingredients: Array<{
    ingredientId: string;
    baseAmount: number;
    baseUnit: 'g'|'ml'|'piece';
    optional?: boolean;
    substitutionGroup?: string;
  }>;
  methodTags: string[];        // e.g. steam, stir_fry, soup
  proteinTags: string[];       // e.g. fish, egg, tofu
  cookMinutes: number;
  allergyTags: string[];
  stepsZh: string[];
  verifiedNutrition?: Record<string, number>;
};
```

A *meal* may have several recipe components (dish + side + grain); a dish is not the same thing as a whole meal. Start from 30–40 reviewed home-style recipes, not free-form LLM recipes with invented quantities.

### 5.3 Safety and eligibility (hard rules)

- Honor confirmed allergies, exclusions, clinician-provided limitations and recipe-food compatibility.
- Only select physically usable stock with reliable conversions and adequate quantity.
- If stock is insufficient, offer a smaller feasible meal, substitute or grocery-list gap. Do **not** claim a recipe can be cooked entirely from existing stock if it cannot.
- Respect sourcing: Daughter organic preferred, Mom flexible. Prefer organic allocation to Daughter but permit an explicit confirmation when non-organic/unknown ingredients are needed.
- For same-pot cooking, show accurate *whole-dish* sourcing. For separately prepared identical dishes, record separate lines.
- Do not derive individual clinical calorie/protein prescriptions from height/weight alone. Use broad balanced-meal heuristics and optional personalised guidance.

### 5.4 Variety and balanced-meal heuristics (soft rules)

- Generate breakfast, lunch and dinner **jointly**, using a working copy of available stock and expected ingredients so meals do not overpromise stock.
- No identical recipe in two slots of one day.
- Aim not to repeat the exact dish from the past seven days; rotate staple, major protein, vegetables, preparation method and dish style.
- Include appropriate protein sources, carbohydrates, vegetable/fruit variety and fats across the day; don't require every tag in every single individual dish.
- Rotate breakfast styles as much as practical; favour familiar Chinese home cooking for household preferences.
- Use older suitable stock earlier; avoid waste and avoid forced purchases.
- Limited stock takes priority over variety: if alternatives are infeasible, disclose it and recommend the honest feasible option.
- Never punish the player for eating something repeatedly or missing a meal.

Suggested planner pseudocode:

```text
function planDay(date, householdProfiles, usableBatches, recentHistory, preferences):
    candidates = validatedRecipesFilteredByRestrictionsAndMealSlot()
    options = rankCombinationsOf3Slots(candidates,
              simulateSharedIngredientUse = true,
              sourceAllocation = organicPreferredForDaughter,
              factors = [stockFreshness, recipeNovelty, preferences,
                         prepEffort, foodGroupDiversity])
    if options.hasFeasibleCombination:
        return explainablePlan(topRankedCombination, stockPreviewPerMeal)
    return partialPlanWithHonestMissingIngredientsAndAlternatives()

# Preview/plan generation changes no physical stock.
# On reroll, replace only requested meal; recalculate other plans' availability.
# Revalidate actual stock in a backend transaction before cooking confirmation.
```

A user may complete a slot with `在外面吃了`, `用剩菜`, `自己吃了别的`, or mark it unplanned. These should not deduct irrelevant ingredients.

## 6. Cooking, servings, consumption, leftovers

### 6.1 Confirm cooking

Flow: `收获篮` or planned meal → `开始做饭` → choose/verify ingredients and **actual quantities** → show organic-source disclosure as needed → `我做好了` → atomic commit.

Backend steps (single transaction with row locking/appropriate concurrency control):

1. Validate household membership and permissions.
2. Lock relevant stock batches and live holds.
3. Release/consume the cook's applicable basket holds within the same transaction.
4. Check `actual_used <= on_hand - other_people_active_holds` for every batch. If insufficient, abort with corrective UI.
5. Deduct exact actual quantities; create immutable `stock_movements` records.
6. Create `cooking_session` with `cooking_session_lines`, recipe, date and expected servings.
7. Close used basket lines; persist a single successful result associated with a unique `idempotency_key`.
8. Tell UI to update the farm and basket. Retry of the same key must **not double-deduct** stock.

If the user cancels, don't deduct stock. If actual amounts differ from reserved amounts, use the validated actual values, not the originally suggested recipe amounts.

### 6.2 Actual eating and leftovers

After cooking, ask `我们吃了多少？` for both people with `现在记录` and `稍后再记`.

- Daughter: actual portions (e.g. 0.8 serving) or none.
- Mother: actual portions (e.g. 1.2 servings) or none.
- Remaining cooked amount becomes a **leftover batch** with cooking/storage date and serving unit.
- Leftover meal can be planned for another slot; eating leftover food decrements the *prepared-food batch*, not the already-used raw ingredients.
- `DiscardLeftovers` reduces prepared-food leftovers and records waste.
- Do not infer storage safety from decorative freshness or automatically assign a universal expiry date; use authoritative handling guidance and user-visible food-safety notices.

## 7. Data model / database tables

Use relational tables with UUID keys, household scoping and server-side permissions:

```text
households(id, name, timezone, created_at)
household_members(id, household_id, auth_user_id, role, nickname)
profiles(id, member_id, organic_preference, allergies, exclusions, portion_preference, ...)
ingredient_catalog(id, name_zh, name_en, zone, unit, nutrient_tags, model_asset_id)
inventory_batches(id, household_id, ingredient_id, organic_status, quantity_on_hand, ...)
stock_movements(id, household_id, batch_id, delta, reason, actor_id, reversal_of?, ...)
harvest_baskets(id, household_id, owner_id, status, expires_at, ...)
basket_lines(id, basket_id, batch_id, reserved_quantity, ...)
recipe_templates(id, name_zh, base_servings, meal_slots, ...)
recipe_ingredients(id, recipe_id, ingredient_id, base_amount, unit, ...)
daily_meal_plans(id, household_id, meal_date, plan_version, status, ...)
planned_meals(id, plan_id, slot, recipe_set, status, ...)
planned_allocations(id, planned_meal_id, profile_id, batch_id, amount, ...)
cooking_sessions(id, household_id, meal_id?, cook_id, idempotency_key, status, ...)
cooking_session_lines(id, session_id, batch_id, actual_quantity, unit)
prepared_food_batches(id, household_id, cooking_session_id, servings_remaining, ...)
meal_consumption(id, prepared_food_batch_id?, profile_id, servings, meal_date, slot)
```

**Implementation note:** `quantity_on_hand` can be materialized for performance, but the ledger must be auditable. Server transactions must enforce row-level permissions, idempotency, stock non-negativity and hold consistency. Use decimal numeric types for stock, not unbounded JS floating-point sums.

## 8. App-state vs authoritative state

- **Persist on backend:** household identity, physical stock, reservations, plan, cooked and eaten history, batch sourcing, stock movements.
- **Ephemeral UI state:** camera pan/zoom, selected zone/mesh, animation phase, open bottom sheet, particle effects, tutorial step.
- **Derived game state:** mature vs empty crops, crop counts, urgency badges. It must be recomputed from authoritative inventory+reservations after sync.
- **Offline fallback:** the farm may render cached data in read-only or explicitly marked offline mode; **do not claim authoritative shared stock updates succeeded without network confirmation**. Offline queued writes require a separate later design with conflict resolution.

## 9. Reuse of old prototype

The old prototype's `src/domain.mjs` contains useful tests and concepts for batching, reservations, stock movements, cooking confirmation and source warnings. Port its **domain rules and test cases** to TypeScript. Do **not** keep its static SVG scene as the 3D implementation or treat its single-device `localStorage` as two-phone sync.

Any migrated function must pass new tests for multiple active baskets and server-side concurrency before real shared use.

## 10. Chinese-first UI messages

| Trigger | Text |
|---|---|
| Tap ready crop | `收获 1 个番茄` |
| Harvest success | `收获成功！已放进篮子` |
| More stock available | `还有库存，正在长出来…` |
| No more stock | `没有库存啦，去补货吧` |
| Empty basket | `篮子还是空的，去农场看看吧` |
| Auto plan | `帮我决定今天吃什么` |
| Manual plan | `我想自己选` |
| Reroll | `换一道菜` |
| Start cooking | `开始做饭` |
| Actual usage | `实际用了多少食材？` |
| Cooking confirmation | `我做好了` |
| Organic mix warning | `这道菜会用到非有机或来源不明的食材，仍要做吗？` |
| Consumption | `妈妈和女儿分别吃了多少？` |
| Finished ingredient | `用完了` |
| Stock conflict | `库存刚刚发生变化，请检查数量` |
| Outside meal | `这顿在外面吃了` |

Language keys must be externalized (e.g. `zh-CN.json`, `en.json`), not hard-coded into meshes.

## 11. Acceptance / invariant tests

**Stock and farm**

- [ ] Add 6 organic tomatoes; farm shows harvestable tomatoes. Harvest 2 → on-hand still 6, held 2, available 4.
- [ ] After harvest, the plot briefly empties and regrows because 4 are available.
- [ ] Harvest 4 more → available 0 and plot becomes `OUT_OF_STOCK`.
- [ ] Return 1 tomato reservation → available 1 and plot regrows; physical on-hand unchanged.
- [ ] Confirm cooking using 2 tomatoes → physical on-hand becomes 4; no second deduction when logging eating.
- [ ] Cooking a second time with the same idempotency key does not deduct again.
- [ ] Correct batch stock to 0, after resolving active holds → farm stops regrowing.
- [ ] Adding 3 new tomatoes → farm visually restocks; physical on-hand increases exactly 3.
- [ ] Separate organic and non-organic batches never silently merge.

**Two users / concurrency**

- [ ] Daughter holds 2 tomatoes, Mom holds 1; total holds cannot exceed physical stock.
- [ ] Two simultaneous harvest requests for the final egg: at most one succeeds.
- [ ] Mom cooking cannot consume a quantity actively reserved by Daughter.
- [ ] Rejected network call does not animate a committed physical deduction or leave a phantom reservation.
- [ ] Correcting stock below live holds prompts explicit resolution rather than corrupting totals.

**Meal planning and consumption**

- [ ] Three distinct breakfast/lunch/dinner recommendations when feasible.
- [ ] Planning all three does not allocate the final fish twice.
- [ ] Reroll changes no physical stock.
- [ ] Mixed-source dish clearly warns on Daughter's organic preference, but allows confirmed exception.
- [ ] Recorded per-person servings and leftovers do not reduce raw stock again.
- [ ] Eating out records the slot without inventing a cooked meal or subtracting ingredients.
- [ ] No calorie restriction is inferred solely from body measurements.

**3D/UX**

- [ ] Farm objects are tappable in mobile Safari and Chrome; navigation works without keyboard or hover.
- [ ] Camera controls do not prevent vertical page/bottom-sheet interaction.
- [ ] `prefers-reduced-motion` bypasses harvest/regrow animation while keeping all commands functional.
- [ ] No-WebGL fallback offers a list for harvest, inventory and meals.
- [ ] Farm remains an illustration of stock, not a safety indicator.

## 12. Out of scope until later

- Real biological crop-growth timers, purchase of virtual seeds, coins/gacha or competitive leaderboards.
- Automatic photo/receipt or voice inventory recognition (future phase; must confirm AI proposals).
- Generating unrestricted recipes from an LLM with unverified portion quantities or safety claims.
- Synchronized offline writes and multi-user conflict merging before transactions/permissions are in place.
- Detailed clinical nutrition optimisation without validated personal health requirements.

---

**Rule of thumb:** The 3D farm may be whimsical; the inventory and food-allocation maths must always be literal, verifiable and reversible.