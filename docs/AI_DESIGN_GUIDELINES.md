# Kitchen Garden — AI Design Guidelines v2.0

**Purpose:** concise implementation contract for Codex and other coding agents. Read this file before modifying any Kitchen Garden visual or interaction component.

## Before writing code
1. Inspect the actual repository branch and the current `public/phase0/` files.
2. Read `docs/DESIGN_SYSTEM.md`, `docs/DESIGN_STYLES.md`, `docs/REUSABLE_DESIGN_ELEMENTS.md`, the PRD and GAME_LOGIC.
3. Classify the change: **UI**, **flat SVG**, **recipe art**, **real 3D**, or **inventory domain**.
4. Reuse existing implementations. Do not claim a documented conceptual asset ID is an exported component.
5. Preserve working interactions and implement one small, independently testable change at a time.

## Visual generation rules
- UI: garden-green CTA (`#4CAF7A`), warm cream (`#FFF9F2`), rounded controls, clear readable typography.
- Grocery icons: flat 64×64 SVG, simple filled silhouettes, no gradients or clay/3D effects. Reuse `ingredientIconMarkup`.
- Recipe art: layered 320×240 SVG from shared food shapes, plate/bowl; reuse `recipeArtMarkup` and stable recipe IDs. No binary image upload.
- Farm: preserve actual Three.js 3D, mint/sage/pink palette, grounded objects, shadows and camera. Do not substitute images or CSS drawings.
- Farm HUD: no permanent resource quantities, tomato/egg buttons, back button, add-food text or chicken bubble. Pan/pinch/tap; empty 3D + for restock.
- Recipe-first: View Recipe, Another Idea and favourites; no mandatory cooking confirmation.

## Data safety
- Never invent on-hand quantities or assume unknown groceries are available.
- Viewing a recipe must not deduct physical stock.
- Current basket reservations are known technical debt. Do not silently change inventory semantics; propose and test the selection-only migration separately.
- Organic source labels must reflect actual recorded batches.
- Decorative crops and illustrations never create stock.

## Accessibility and localisation
- English default, Simplified Chinese selectable. Add both translations for all new visible copy.
- SVG artwork decorative with accessible text labels.
- Keep keyboard access, visible focus, reduced motion, non-WebGL fallback and generous hit targets.
- Avoid trapping focus incorrectly in recipe dialogs and sheets.

## Quality gates
- Run existing build and domain tests.
- Test 320/375/390/430px and desktop.
- Verify real iPhone Safari WebGL camera, tap, pinch and fallback where available.
- Compare actual screenshots to approved reference; do not use generated mockups as proof.
- Report incomplete testing and known gaps explicitly.

## Delivery
Use a new feature branch and draft PR. Update documentation and tests alongside implementation. Never merge to production without approval.
