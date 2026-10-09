# Kitchen Garden Design System v2.0

**Updated:** 2026-10-09. **Baseline:** `feature/kitchen-garden-flat-svg-art-20261009`. Documentation-only update; no production changes.

## Three design layers

| Layer | Implementation | Guidance |
| --- | --- | --- |
| UI | `styles.css`, `index.html`, `game-ui.js`, `recipe-discovery.js` | Green controls, cream cards, mobile bottom sheets, minimal HUD |
| Flat 2D | `ingredient-icons.js`, `recipe-art.js` | Flat SVG grocery icons; layered reusable recipe compositions |
| Real 3D | `world.js`, `grounding.js`, `scene.js` | Soft Pastel Toy World, real geometry, grounded shadows, touch camera |

## Approved rules

- The 3D farm remains real Three.js, with sage island, mint sky, pink farmhouse and white hen.
- Keep the farm HUD minimal: no permanent quantity badges, Tomato/Egg buttons, Back to Farm button, Add Food labels or chicken speech bubble. Pan, pinch, tap and double-tap to reset.
- Empty crop/nest uses an interactive green 3D + to open Pantry.
- UI primary actions are garden green, secondary surfaces warm cream, text readable.
- Grocery icons are **flat SVG**, not clay-shaded; recipes use layered 2D SVG compositions assembled from reusable food shapes and tableware.
- No binary WebP upload is required for recipe images. Recipe cards and details reuse the same illustration by recipe ID.
- The product is **recipe-first**: recipe viewing never deducts physical stock. No mandatory cooking confirmation.
- Navigation: Farm / Today's Meals / Pantry; basket accessible in header.
- English first, Simplified Chinese switch.
- Never invent stock, organic certification or recipe feasibility.

## Documentation

- [DESIGN_STYLES.md](./DESIGN_STYLES.md) — current tokens, typography, spacing, UI/2D/3D art direction.
- [REUSABLE_DESIGN_ELEMENTS.md](./REUSABLE_DESIGN_ELEMENTS.md) — UI, SVG and 3D component inventory.
- [AI_DESIGN_GUIDELINES.md](./AI_DESIGN_GUIDELINES.md) — agent instructions and acceptance.
- [FLAT_SVG_RECIPE_ART.md](./FLAT_SVG_RECIPE_ART.md) — recipe-art implementation.
- [MINIMAL_FARM_CAMERA.md](./MINIMAL_FARM_CAMERA.md) — camera gestures.
- [EMPTY_3D_PLOT.md](./EMPTY_3D_PLOT.md) — empty-state restocking.
- [KITCHEN_GARDEN_PRD.md](./specs/KITCHEN_GARDEN_PRD.md) — product requirements.
- [KITCHEN_GARDEN_GAME_LOGIC.md](./specs/KITCHEN_GARDEN_GAME_LOGIC.md) — inventory invariants.

## Implemented versus future

**Implemented:** green CSS UI, flat SVG icons, seven composed SVG recipe illustrations, 3D farm and gestures, contextual sheets, recipe suggestions, device-local favourites and inventory.

**Not yet complete:** exported reusable 3D asset modules, unified cross-medium runtime tokens, reusable published UI component package, cross-device inventory sync, full recipe library and measured iPhone visual/performance acceptance.

**Known technical debt:** the basket still uses temporary reservations despite the agreed recipe-selection-only experience. Resolve this in a separately tested domain migration. Older documentation may describe superseded clay-shaded icons or WebP images; this v2 specification takes precedence for design intent, while actual code is authoritative for runtime behaviour.

Do not silently change product decisions or production. Implement on branches, test and review.
