# Kitchen Garden — Harvest → Basket → Recipe → Cook Interaction Design

**Version:** 1.0 · Phase 1 · 2026-10-08  
**Design status:** Implemented first playable vertical slice; further visual and physical-device validation required.  
**Art direction:** Soft Pastel Toy World, based on `DESIGN_STYLES.md` and `REUSABLE_DESIGN_ELEMENTS.md`.

## Product promise

**“Open the farm. Harvest what is really at home. Cook something without wondering what to make.”**

The first playable interaction connects the real miniature 3D farm to an actual local inventory. It supports only **tomatoes and eggs**, and one curated Chinese home-style recipe: **Tomato & Egg Stir-fry (番茄炒蛋)**. It is not the full five-area island or automated three-meal planner.

## Primary mobile navigation

**Farm · Today's Meals · Pantry**. Keep the **My Basket** control in the top header, not as a fourth permanent bottom tab. There is no blocking tutorial, joystick or mandatory character movement.

## 0. Initial empty-inventory state

- The local pantry starts with **zero recorded ingredients**. Do not pre-populate sample quantities, because they could be mistaken for groceries at home.
- Farm areas remain visually recognizable, but the 3D tomato fruit and nest eggs are hidden until usable stock is recorded. The empty soil bed and nest remain.
- The chicken helper directs the family to the **Pantry** to add groceries. The 3D tomatoes/nest retain invisible touch targets to open the ingredient sheet and reach the restock shortcut.
- The non-WebGL fallback provides tappable **Tomatoes** and **Eggs** actions with the same inventory logic.

## 1. Farm and harvest interaction

**Entry:** tap a 3D tomato, tap the 3D egg nest, or choose the equivalent labelled DOM buttons.

**Camera:** orthographic elevated overview → gentle focus on selected resource; selected resource must remain visible above the ingredient sheet. The original camera offset, grounding and soft lighting remain.

**Ingredient sheet:**

- Name, icon, farm zone and actual on-hand / reserved / available numbers.
- Batch selector retaining organic / non-organic / unknown sourcing and storage; only usable, unblocked batches are offered.
- Whole-piece quantity stepper, with limits based on verified available quantity.
- Primary action: **Harvest to basket / 收获到篮子**.
- Secondary action: **Add or correct pantry stock / 添加或调整库存**.
- If no eligible stock, harvesting is disabled; the restock shortcut remains enabled.

**Confirmed harvest:** invoke the domain's `reserve`. Physical on-hand does not change. Update availability, basket count and (if 3D is running) the cosmetic crop animation. Momentarily hide the reserved visual resource, then make a toy-like pop/regrow only when real availability is still positive. No crop growth creates food.

**Out-of-stock:** leave plot/nest empty and keep explicit access to Pantry. Decorative tomato crate remains non-interactive and must not contribute stock.

## 2. My Basket

**Entry:** header basket icon or the Today's Meals shortcut.

The panel lists **specific batch reservations**, not an inferred total. For each line show resource icon, ingredient, organic source, quantity and actions **Update** and **Remove**. The user can **Return everything to farm**. All these actions adjust only the *reservation*, never physical stock.

Held ingredients automatically expire after approximately **30 minutes** when the app next loads or is interacted with; expiry releases holds but cannot deduct stock.

### Recipe discovery within the basket

- Show one curated recipe card for Tomato & Egg Stir-fry.
- For the intended two-person dish, require **2 tomatoes + 3 eggs** reserved before enabling **Cook with these**.
- If insufficient, show the exact ingredient gap; do not claim that the basket can cook the recipe.
- Multiple organic/nonorganic batches of the same ingredient remain separate.

## 3. Recipe Detail

**Entry:** Basket → **Cook with these**.

The recipe panel displays the warm clay/pastel UI, dish name, simple icon-led food visual, cooking duration (~15 minutes), and exact actual/required ingredient quantities for two prepared servings. It provides a short reviewed cooking method, not an unrestricted AI-generated recipe.

**Action:** **Start cooking** opens the separate actual-usage confirmation sheet. Browsing recipe content does **not** deduct stock.

**Health note:** This is one dish rather than a complete meal. The interface recommends adding other available food groups and makes no calorie or clinical nutrition prescriptions from height/weight alone.

## 4. Actual-usage review and cooking completion

**Entry:** Recipe Detail → Start cooking.

Before the user commits, show each **selected batch** and an editable **actual quantity used**. The user can cook more or less than they reserved, provided real on-hand stock supports it. At least one tomato and one egg must remain in the actual recipe. No negative/fractional units.

For a shared dish containing non-organic or unknown-source ingredients, require explicit acknowledgement that the Daughter's organic preference cannot be guaranteed. Never label a mixed-source dish as fully organic.

**Action:** **I cooked this / 我做好了** invokes a validated, idempotent cooking command. It:

1. Checks real on-hand for every selected batch, safe use-by status, ingredient minimums and source acknowledgement.
2. Deducts **only the actual amounts used** from physical stock.
3. Clears/releases this basket's reservations.
4. Appends stock movements and a cooked-session record of **two portions prepared** (not recorded as eaten).
5. Updates the 3D farm's available resources and presents **Cooking complete**, with new stock quantities.

A repeated submission with the same idempotency key cannot deduct stock again. Recording what each person ate and leftovers is a later phase; do not infer eating from the cooking button.

## Pantry management

Manual **Add groceries** supports Tomato/Egg, whole-piece quantity, organic/nonorganic/unknown source, fridge/freezer/pantry and optional use-by date. Each addition creates a **separate batch** with an audit movement. The inventory is displayed by batch. **Update** changes physical stock after verifying existing holds, and **Used up** sets that batch to zero if not reserved. Expired use-by batches remain visible in physical inventory but are blocked for harvest.

All quantities are **device-local** via a versioned localStorage state. These must not be marketed as shared synchronized household amounts. If storage is disabled, warn that changes may be temporary.

## Screens, interaction states and accessibility

| Screen | Primary action | Empty/blocked/error state | Close/return |
| --- | --- | --- | --- |
| Farm | Tap resource or visible DOM action | Bare bed/nest with restock path | Return to overview |
| Ingredient | Reserve validated batch quantity | No stock, expired, over-reserved → disabled or error | Close modal |
| Basket | Adjust holds, view recipe | Empty basket / ingredient gap | Return to farm |
| Recipe | Start cooking | Not enough reserved → button disabled | Back to basket |
| Actual usage | Confirm cooking | Insufficient, source exception, invalid quantity → inline alert/retained form | Back to recipe |
| Completion | Review new stock | No duplicate deduction | Back to farm |
| Pantry | Add/correct/use up real groceries | Empty pantry, blocked correction | Bottom navigation |

- Touch controls target about **44×44 CSS px minimum**; semantic labels and keyboard focus/escape are present.
- Maintain English first-launch and Simplified Chinese in Settings; dynamic content and error/status messages must localize.
- Respect `prefers-reduced-motion` and preserve a complete non-WebGL path.
- Confirm tap/drag distinction and camera/sheet clearance on actual iPhone Safari before visual sign-off.

## Actual v1 source map

- `public/phase0/world.js`: live 3D tomato group, egg nest, hit colliders, display derived from stock, cosmetic harvest/regrowth.
- `public/phase0/scene.js`: lights, camera, raycast input, fallback, adapter into game UI.
- `public/phase0/domain.js`: pure stock/reservation/cooking invariants and in-memory state transitions.
- `public/phase0/game-ui.js`: local persistence, navigation, all sheets, form event handlers.
- `public/phase0/index.html` / `styles.css` / `i18n.js`: semantic screen markup, approved palette, responsive UI, locale copy.

## Validation checklist

- [x] Baseline 6 tomatoes + 8 eggs → reserve 2 + 3 → cook exactly 4 + 5 physical stock.
- [x] Cancelling holds does not deduct food; recipe only enables at intended quantities.
- [x] ConfirmCooked is idempotent and source warnings are validated in the domain.
- [x] Browser non-WebGL end-to-end flow works at responsive widths.
- [ ] Actual hosted WebGL tomato and egg tap interactions checked on Safari.
- [ ] 3D harvest/regrowth and shadow consistency visually reviewed on physical iPhone.
- [ ] Cross-device household sync (Phase 2; not promised in this release).
- [ ] Multi-meal recipe engine, actual consumption and leftovers (later phases).
