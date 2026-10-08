# Kitchen Garden — Phase 0 implementation handoff

**Scope:** first hosted 3D technical proof only. This is **not** the completed 3D farm or a real inventory system.

## Repository and backward compatibility

- Target: `Cecichencc/mama-kitchen`, existing React 18 + Vite 5 app.
- Existing entry file `index.html` referenced `./src/main.jsx`, but the live `main.jsx` was in the repository root. Patch the script path to `/main.jsx` so the legacy kitchen app remains available at `/`.
- New isolated game entry: `public/phase0/index.html`, accessible as `/phase0/index.html` after Vite/Vercel build.
- No edits to the legacy recipe library or `/api/recipe` endpoint.
- Existing top-level files `src_app`, `src_main`, and `api` are unusual duplicates; review them before a larger migration, not within Phase 0.

## Stack decision and dependency limitation

The production game is intended to use `Three.js` + `@react-three/fiber` (React 18-compatible v8) with modular React UI, Vite and later Supabase. This technical proof uses **real Three.js / WebGL** but loads a **pinned Three.js 0.167.1 ESM** from jsDelivr in an isolated static page. Reason: npm registry access was unavailable in the development environment. This avoids an unverified package-lock migration while proving actual mesh selection, orthographic camera framing, clay scene composition and Safari WebGL support.

Before Phase 1, migrate the scene to an NPM-managed `three` dependency plus `@react-three/fiber` and `@react-three/drei`, update the lockfile and test the build. Do not maintain a CDN dependency for the production farm. **External CDN access remains a dependency of this preview**, and a browser-level offline or blocked-network failure should show the accessible fallback.

## Phase 0 includes

1. Grassy floating island using real Three.js meshes, warm lights and low-poly clay materials.
2. Tomato plot, several 3D tomato meshes, stylized barn, chickens, trees and fencing for reference fidelity.
3. Orthographic elevated camera, smooth selection focus/return to overview.
4. Raycast collider larger than the hero tomato, plus an accessible DOM selection button.
5. Modal ingredient bottom sheet; no stock side effects.
6. WebGL/unavailable-module fallback, Escape handling and reduced-motion support.
7. Responsive Chinese-first UI for iPhone widths, with large touch buttons.

## Known limitations

- **No backend, stock, cooking, harvest reservations, account sync, or 3-meal planner yet.** Explicit demo text prevents misleading stock claims.
- Uses primitive geometry and simple procedural clay forms; final quality requires Blender-authored GLBs and art-direction screenshot approval.
- No pan, pinch zoom, or rotation in Phase 0; only overview and ingredient camera focus. This deliberately constrains complexity.
- External Three.js import prevented full WebGL rendering tests in the current network-restricted container; physical device Safari gate must be performed on the hosted preview before Phase 0 is declared accepted.
- Initial Chromium/Playwright QA should verify fallback, modal, layout, tab/keyboard, and file loading; real scene QA requires CDN/web access.
- Vercel project `mama-kitchen` exists, but reading deployment information returned a scope/permission error. Preview URL **must not be invented**. Confirm Vercel GitHub integration and reconnect team scope if needed.

## Visual acceptance (separate from function)

Use the approved design screenshot from the PRD as the art-direction target: miniature connected grassy island, rounded matte clay silhouettes, soft orange/cream colour palette, red barn, responsive Chinese labels. Phase 0 *proves rendering*, not exact visual fidelity. Capture iPhone screenshots and review island occupation, camera target, tomato hit region, type size and background contrast. Final polish and original GLB asset kit are a Phase 1–3 effort.

## Functional acceptance checklist

- [ ] HTTPS preview for `/phase0/index.html` opens on physical iPhone Safari.
- [ ] The canvas is real WebGL, not CSS/SVG.
- [ ] Tapping visible tomato opens the ingredient sheet.
- [ ] `查看番茄` button selects tomato even if mesh tap is difficult.
- [ ] After dismissing sheet, `回到全景` returns camera to original view.
- [ ] No stock changes can occur in Phase 0.
- [ ] Fallback remains actionable when WebGL/CDN unavailable.
- [ ] Small-phone layout at 320px does not horizontally overflow.
- [ ] Reduced-motion mode is usable.
- [ ] No unexpected changes to legacy kitchen app root route.

## How to preview

1. Build the Vite project as usual. Assets in `public/phase0` copy unchanged to `dist/phase0`.
2. Open `/phase0/index.html` on the deployed preview hostname.
3. On iPhone Safari: tap a tomato, then test `查看番茄`, close sheet, `回到全景`; repeat at different orientations.
4. If 3D fails, note the error status and test the fallback. Network access to the pinned Three.js module is required.

## Phase 1 transition after approval

- Install and lock R3F/Three packages; move scene to React components behind a WebGL boundary.
- Keep all camera/scene animation state ephemeral.
- Add tomato/egg models, basket reservation layer, local storage of test inventory and one recipe `番茄炒蛋`.
- Enforce the authoritative stock invariants from `KITCHEN_GARDEN_GAME_LOGIC.md`.
- Add unit tests for `6 tomatoes + 8 eggs → hold 2 + 3 → cook → 4 + 5`, cancel, duplicates, and overbooking.
