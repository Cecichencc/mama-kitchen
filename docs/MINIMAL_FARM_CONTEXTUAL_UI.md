# Kitchen Garden — Minimal Farm Step C: Contextual Ingredient UI

**Implementation:** feature branch only; no production merge.

## Updated
- Farm stays visually clean and interactive via pan/pinch/tap.
- Ingredient bottom sheet prioritises **ingredient name, sourcing, quantity and Add to Basket**.
- Detailed stock totals are no longer shown in the ingredient sheet; the batch selector still identifies sourcing and available batch choices.
- Redundant Add Groceries shortcut is hidden from the normal ingredient sheet; tapping the existing empty 3D plot marker continues to open preselected Pantry.
- Existing 3D farm, camera gestures, language support, basket and stock accounting remain unchanged.

## Review
- On stocked tomato, tap and verify only the contextual sheet appears.
- On empty tomato, tap + and verify Pantry opens with Tomato selected.
- Confirm a selected ingredient never deducts physical stock.
- Test English and Chinese, 320/375/390/430px, fallback, keyboard and real iPhone Safari.
- Verify crop hit targets remain reachable after pan and zoom.
- Basket still has temporary reservation semantics; separate domain migration required.

**Status:** Source updated; full device QA remains pending.
