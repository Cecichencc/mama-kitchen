# Kitchen Garden — Step 03: Interactive Empty 3D Plot

**Status:** Development branch implementation, awaiting real WebGL/iPhone review.

## Behaviour
- `world.js` now builds actual Three.js green + markers, with pale cream discs and soft green rings, for tomato soil and the egg nest.
- Each marker has a larger invisible 3D hit target, using the same ingredient metadata as the existing crop colliders.
- When the inventory UI reports zero **available** items, the visible crop disappears and its corresponding + marker appears.
- Tap the empty resource: the existing `openRestock(ingredientId)` flow navigates to Pantry, selects the correct grocery, and focuses quantity.
- Add quantity, organic status, storage and optional use-by date; saving updates device-local physical stock and returns to Farm. The marker disappears and the ingredient regrowth animation runs.
- An accessible DOM resource button and localized empty-state hint remain available even without WebGL.
- No new stock is created by animations. No automatic deductions or cooking confirmation.
- Existing pink farmhouse, chicken, shadow-grounding, English/Chinese language, recipe-first flow and 3-tab navigation are preserved.

## Files
- `public/phase0/world.js`: reusable `restockMarker()`, tomato/egg 3D markers and colliders.
- `public/phase0/game-ui.js`: visibility of empty resource hints.
- `public/phase0/index.html`: localized hint labels.
- `public/phase0/styles.css`: cream/green hint styling.

## Acceptance review required
1. Fresh device: both empty plots show green + markers and accessible Add Food labels.
2. Tap the tomato + on iPhone Safari: Pantry opens with Tomato selected.
3. Add 6 tomatoes: plot reappears and + disappears; egg remains empty.
4. Mark tomato stock as zero (after releasing any basket holds): plot returns to empty.
5. Tap egg +, add 8 eggs: nest eggs reappear.
6. No phantom stock increase or deduction.
7. Check 320, 375, 390, 430px, WebGL/fallback and reduced-motion behavior.
8. Verify no 3D marker overlap with tomatoes, fences or chicken.

**Known limitation:** Recipe basket still uses temporary reservations; zero available can occur when items are held even though physical stock remains. This will be corrected in a separate domain change. Do not merge until actual WebGL interaction has been checked.
