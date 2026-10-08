# Kitchen Garden — Phase 0 Soft Pastel Toy World redesign

**Status:** Development-branch implementation; no changes to production household inventory or recipes.

## Target

The user-approved pastel design board is the art-direction target. It does not contain production-ready 3D meshes. The farm is rendered using real Three.js WebGL geometry in the existing isolated /phase0/index.html proof, not a flat screenshot. The main React/Vite application remains untouched.

## Stage A — Pastel visual foundation

- Centralize cream/coral/teal/sky/grass design tokens in styles.css and material colors in world.js.
- Replace saturated orange backdrop with mint-blue sky, softer distant hills and light green terrain.
- Use transparent WebGL over outdoor sky/cloud artwork, gentle lighting and responsive orthographic framing.

## Stage B — 3D asset refinement

- Rounded floating island, shallow beds, fences, path stones, small flowers and grasses.
- Blush pink barn with darker roof, light trim, dormer and windows.
- Reusable rounded clay foliage, curved-stem tomato vines and five selectable tomatoes with generous touch colliders.
- White hen with little coral comb, beak, wings and subtle idle movement.
- No substitute image for a real 3D mesh; procedural assets are deliberately lightweight and can later be replaced with GLB models.

## Stage C — Mobile UI

- Compact header; full-height farm scene; helper dialogue; clear tomato call-to-action.
- Cream bottom sheet showing tomato details, not invented quantity or organic status.
- Keep the first Phase 0 interactions: tap tomato, camera focus, return to overview, WebGL fallback.
- Bottom navigation is Farm / Today's Meals / Pantry. Only Farm is active; other tabs explicitly say Coming soon.
- Explanatory technical content moves to Settings > About this preview.

## Stage D — Localization

- English on first launch; Settings > Language supports English and Simplified Chinese.
- Translation keys in i18n.js are used by visible text, accessible labels, and titles.
- Saved language preference persists in localStorage when allowed; Safari restricted storage fails gracefully.
- Date and recipe localization are later-stage work because those screens are not implemented in Phase 0.

## Stage E — Validation

- Automated Node tests: layout structure, geometry, palette, accessibility/fallback, modular architecture, language switching and stock-safety invariant.
- CI checks Node tests, Vite build and public Phase 0 entry.
- Non-WebGL browser checks at 320, 375, 390, 430 and desktop widths.
- **Pending physical iPhone Safari test:** visual quality, real WebGL tomato tap, camera composition and actual frame rate must be verified from live device screenshots.

## Limitations and product boundaries

- Phase 0 still imports pinned Three.js 0.167.1 from jsDelivr. Full React Three Fiber integration is a later architectural phase after package-registry availability.
- The farm is a miniature art-direction proof with one functional resource: Tomato. A full five-area island, recipe/planner flow, reservations and two-user inventory remain future milestones.
- No harvesting quantities, ingredient deductions, AI recipe functionality or fake sample stock values have been added.
- A successful CI build is not evidence that actual iPhone 3D visual fidelity or FPS has passed review. Compare screenshots against the user's approved board before Phase 1.
- Ship to a **branch preview only**. Do not merge into main or promote a production deployment without the user's approval.
