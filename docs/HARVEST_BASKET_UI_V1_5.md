# Kitchen Garden — Phase 1.5 Step 04: Harvest and Basket UI

**Status:** Implemented on a review branch; pending browser and device QA.

## Changes
- Harvest bottom sheet: consistent miniature grocery icon, soft green availability panel, cream quantity area, green action and rounded controls.
- Basket: each ingredient row uses shared SVG icons, source text, large plus/minus actions, a numerical output, and a separate destructive remove action.
- Quantity steppers call the existing `setReservation` domain command; they do not change physical stock.
- The existing ingredient batch/source selection, 3D camera focus, restock shortcuts, localization and recipe-first flow remain intact.
- The basket still uses temporary reservations and is not yet a non-reserving recipe-selection basket; that domain migration must happen separately.

## Manual acceptance
1. Add six tomatoes and eight eggs in Pantry.
2. Add two tomatoes and three eggs to basket.
3. Increment/decrement the selected quantity; verify count and disabled limits.
4. Remove one line, add it again, then open recipe.
5. Close recipe and confirm physical stock is still six tomatoes and eight eggs.
6. Check 320/375/390/430px, both languages, keyboard focus, WebGL and fallback.
7. Verify the green controls and spacing against the approved board.

No production deployment or merge is requested by this step.
