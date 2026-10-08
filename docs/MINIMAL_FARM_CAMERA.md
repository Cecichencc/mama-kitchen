# Kitchen Garden — Minimal Farm UI and Camera Gestures

**Status:** Development implementation, awaiting iPhone Safari WebGL validation.

## Farm-first changes
- Remove persistent tomato/egg stock badges, resource buttons, Back to Farm button, Add Food hint labels and chicken speech bubble from the **rendered 3D farm HUD**. Existing HTML hooks remain for fallback compatibility.
- Keep the basket and settings icons in the header and three bottom navigation tabs.
- One-finger drag pans within island bounds. Two-finger pinch and mouse wheel zoom with min/max constraints.
- Tap a 3D tomato/egg collider to select. Movement above 10px cancels selection.
- Double-tap empty 3D space or press Home while canvas is focused to reset to overview. Arrow keys pan, +/- zoom.
- Empty crop 3D + marker remains tappable and opens the preselected Pantry form. No visible stock counts on the farm.
- Ingredient sheet, inventory and recipe flows are not changed.

## Validation required
- Actual iPhone Safari: one-finger pan, pinch zoom, tap targets, double-tap reset.
- 320/375/390/430px and desktop camera framing; no ability to lose the island completely.
- Fallback remains usable if WebGL fails.
- No stock mutation from pan/zoom or tapping an ingredient.
- Verify keyboard operation and screen-reader alternatives.
- Check focus/camera transitions when closing sheets.
- Inspect shadows and approved pastel assets remain unchanged.

**Known:** Existing temporary basket reservations remain until a separate domain refactor. This branch changes UI and camera only.
