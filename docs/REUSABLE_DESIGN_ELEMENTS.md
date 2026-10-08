# Kitchen Garden — Reusable Design Elements

**Version:** 1.0 — 2026-10-08  
**Scope:** Catalogue and reuse contract for the **actual Phase 0 3D farm and its mobile UI**, with planned next-phase elements identified separately. Documentation-only; the models and components below are **not** being refactored or changed by this commit.  
**Inspected source:** `feature/kitchen-garden-grounded-shadows-20261008` (`6caa52c`).  
**Related:** [Design Styles](./DESIGN_STYLES.md) · [Design System Index](./DESIGN_SYSTEM.md) · [Game Logic](./specs/KITCHEN_GARDEN_GAME_LOGIC.md).

## 1. Usage rules

A reusable **design element** is a visual/interaction pattern that should look and behave consistently when reproduced. It is not necessarily a published JavaScript component or an exportable 3D asset.

**Current Phase 0 reality:**
- The farm uses real, procedural Three.js geometry in `public/phase0/world.js` from `createPastelWorld(THREE, scene)`.
- `tomato()`, `tree()`, `softBox()`, `sphere()`, `fenceLine()`, `contactShadow()` are **functions local to `createPastelWorld`**, not independently exported component APIs.
- `grounding.js` exports pure calculations; `i18n.js` exports the language translator.
- The UI consists of HTML/CSS classes and event handlers; it is **not yet a React component library**.
- Only **tomato inspection** works as an ingredient interaction. Harvest/stock/cooking states belong to later phases.

**Design consistency contract:**
1. Preserve the approved shape and palette for each element.
2. Assemble the 3D scene from real meshes/materials; never insert the reference image as a faux 3D object.
3. Keep decorative meshes separate from select/click colliders.
4. Anchor all items to real geometry heights; do not hide floating objects with shadow tricks.
5. Never infer household inventory from the number of visible crops.
6. Reuse consistent DOM controls and localized labels for every interactive asset.
7. Introduce shared exported builders in a **later implementation PR** only after tests; this documentation does not claim they exist now.

## 2. Current 3D asset inventory

| Proposed stable asset ID | Design element | Current implementation | Status |
| --- | --- | --- | --- |
| `world/island-soft-square` | Rounded connected floating island | `roundedPlatform` calls in `world.js` | Implemented geometry |
| `world/raised-tomato-bed` | Raised soil bed, low white fence | `roundedPlatform` + `fenceLine` | Implemented geometry |
| `ingredient/tomato-clay` | Resting round tomato with five-leaf crown | Local `tomato(r, material)` | Implemented and selectable in plot |
| `building/farmhouse-pink` | Blush house, gabled roof and arched door | `house` group | Implemented geometry |
| `character/chicken-white` | White helper hen | `hen` + `head` groups | Implemented decoration/idle; not clickable as NPC |
| `vegetation/rounded-tree` | Short trunk, three foliage clusters | Local `tree(x,z,size,variation)` | Implemented instances |
| `prop/crate-tomato` | Grounded decorative timber crate | `crate` group | Implemented decoration |
| `landscape/stone-path` | Flattened cream stepping stones | `steps` array + sphere geometry | Implemented decoration |
| `landscape/picket-fence` | Low wooden fence posts and rails | Local `fenceLine` | Implemented decoration |
| `landscape/flower-tuft` | Tiny flower and grass clusters | Decorative loops | Implemented decoration |
| `fx/contact-shadow` | Shared small contact occlusion | Local `contactShadow` and 64×64 `CanvasTexture` | Implemented visual helper |
| `interaction/tomato-hit-target` | Transparent oversized 3D collider | `colliders` array | Implemented selectable hit area |

**Status terms:** *Implemented* = present in the current 3D build; *planned* = only requirements or guidance, not code. These stable IDs are **documentation identifiers**, not actual runtime asset keys.

## 3. Model design contracts

### 3.1 Island / terrain

**Silhouette:** compact floating rounded-square toy diorama, grass surface over cream/earth edge.

**Existing geometry:** earth base `8.28 × 6.58` world units; grass top `8.22 × 6.52`; rounded corner reference `1.32`; grass platform depth `0.22`. Default grassy surface = `GROUND_LEVELS.grass = 0.43`.

**Rules:**
- Keep one visually connected island and gentle ellipsoid grassy mounds rather than disconnected blocks.
- Terrain receives cast shadows; its whole base must not cast an enormous displaced shadow.
- Avoid excessive elevation where it would hide the tomato plot or farmhouse.
- Additional zones in future should connect with visually continuous paths.
- Use `grassSurfaceY(x,z)` to place objects on mounds, not a hardcoded flat-surface Y.

**Variants:** narrow-screen framing is managed by the camera, not by swapping to a static image.

### 3.2 Tomato / `ingredient/tomato-clay`

**Current factory (local, not exported):** `tomato(r = .25, material = M.tomato)`.

**Appearance:** slightly squashed red fruit (x scale 1.07, y .87, z 1.03), five short rounded green leaves at crown, very short stem, matte surface. Absolutely **no tall stick/stalk** or floating fruit.

**Implemented plot:** five decorative/selectable instances, radii `0.21–0.32`, resting directly on soil (`GROUND_LEVELS.tomatoSoil = 0.62`). Their visible count does **not** represent fridge stock.

**Reusable variants:**
- `standard`: garden crop, normal radius / colour.
- `small`: scaled down decorative fruit, e.g. the crate.
- `selected`: subtle scale/lighting feedback only while inspected.
- `future_reserved`, `future_empty`: future inventory-driven states; **not supported in Phase 0**.

**Interaction contract:**
- Dedicated transparent collider sphere, radius roughly `0.42` world units (one main collider about `0.50`), independent of leaves.
- A hit sets the tomato index, smoothly zooms the camera, and opens the accessible ingredient sheet.
- Colliders have ingredient metadata; decorative crate tomatoes must never create stock reservations.
- A visible `Explore Tomato` DOM button offers an equivalent way into the inspector.
- Do **not** connect scale/tap animation to inventory updates.

**Placement:** use `groundedRootY(GROUND_LEVELS.tomatoSoil, -r * .87)`, with a tiny embed, and a subtle contact shadow of approximately `(r * .95, r * .87)`.

### 3.3 Pink farmhouse / `building/farmhouse-pink`

**Source:** `house` group within `world.js`. **Not yet an independent exported builder.**

**Proportions:** about `1.65` wide × `1.47` deep, lower wall `1.27` high; roof ridge reference `1.95` relative to the local model. Set off to the right of the tomato plot at `x ≈ 1.58, z ≈ -1.12`.

**Features:** blush-pink wall, muted-rose pitched roof, cream arched door/frame, round front window, side window with turquoise panes, small chimney; modeled as 3D meshes, not flat image planes.

**Rules:**
- Front, side and top silhouettes must agree on pitch, opening positions and chimney.
- Keep the building secondary to the whole island; it must not dominate the camera.
- House walls meet grass using their actual lowest bevel point; place contact shadow beneath foundation.
- Planned kitchen entrance is a future interaction. The Phase 0 house is **not an operational cooking screen**.

### 3.4 White chicken helper / `character/chicken-white`

**Source:** `hen` group and separate animatable `head` and wing groups.

**Appearance:** soft white pear-shaped body; round head, two dark eyes, small orange beak/feet, coral comb and wattle, short wings and tail. `hen.scale = 0.76` in current scene, positioned near the right-side path.

**Motion:** head shifts by only `~0.006` world units and gently tilts; wings make tiny rotations. **Never vertically bounce the entire chicken root**: the feet are intentionally grounded.

**Interaction:** Phase 0 has a separate, translated HTML chicken helper message. The 3D hen itself is not a playable character with controls or routing. Do not make users chase the chicken to see the instructions.

**Reuse:** future helper mood/celebration states may animate wing tips and expression, but should be optional, reduced-motion aware, and not tied to inventory writes.

### 3.5 Rounded trees / `vegetation/rounded-tree`

**Current factory (local):** `tree(x, z, size = 1, variation = 0)`. Three instances are used (scale approximately `0.67–0.89`).

**Anatomy:** short tapered cylinder trunk, one large rounded foliage cluster, two smaller overlapping foliage blobs in related green tones.

**Variants:** change `size`, orientation and foliage materials sparingly; keep a recognizable family resemblance.

**Positioning:** call `grassSurfaceY(x,z)`, then `groundedRootY` using scaled trunk lowest point. Each tree uses a small contact shadow at the actual mound surface. Keep foliage clear of primary ingredient hit areas and the helper speech bubble.

### 3.6 Wooden crate / stepping stones / white fences

**Crate:** roughly `0.72 × 0.24 × 0.52` world-unit body with framing slats, resting on flat grass. Tiny decorative tomatoes are non-interactive.

**Stones:** simple flattened ellipsoid stones on the path, using pale cream/stone material, partially embedded in grass; decorative only.

**Fence:** low white posts/rails around bed; posts should be rooted into soil. In the future, make longer fence sections from reusable geometry and avoid dense repeated casts that produce shadow noise.

### 3.7 Flowers and grass tufts

Small white/yellow flowers, rounded grass clumps and low shrubs are **ambient scenery**. They must not look like selectable vegetables. Use a limited number, avoid billboard textures and large cast shadows, and keep the garden readable.

### 3.8 Shared soft contact shadow / `fx/contact-shadow`

**Current local helper:** `contactShadow(x, y, z, rx, rz)`. One radial-alpha CanvasTexture (64×64) is shared for the whole farm. Contact planes sit roughly 0.006 world units above the actual supporting surface, do not cast/receive shadows, and write no depth.

Use tiny values local to an object footprint: house `(.97, .80)`, hen `(.36, .27)`, tree trunks proportional to tree size, tomato radii proportional to fruit, crate `(.46, .34)`.

This is a **subtle contact effect**, not a fake offset shadow or a replacement for proper ground alignment.

## 4. Shared 3D implementation rules

### 4.1 Currently available building blocks

Within `createPastelWorld`:
- `mesh` creates a mesh and applies cast/receive defaults.
- `sphere`, `box`, `cyl` wrap shared primitive geometries.
- `softBox`, `roundedShape`, `roundedPlatform` create miniature clay structures.
- `M` stores shared `MeshStandardMaterial` instances.
- `contactShadow` creates non-interactive local grounding.
- `tomato`, `tree`, `fenceLine` build repeatable visual groupings.

These are **not library imports**. Future module extraction should preserve signatures/behavior or be covered by tests; do not import these names externally until they are actually exported.

### 4.2 Proposed future extraction boundaries *(not implemented)*

| Future module | Potential responsibility |
| --- | --- |
| `assets/materials.js` | Shared named materials and colour variants |
| `assets/primitives.js` | Rounded shapes and common geometry caches |
| `assets/Tomato.js` | Exported tomato builder + dimensions / collider policy |
| `assets/Farmhouse.js` | Composed building builder |
| `assets/Chicken.js` | Character builder + optional motion controller |
| `assets/Tree.js` | Repeated vegetation builder |
| `assets/Environment.js` | Island, fences, beds, stones and flowers |
| `assets/ContactShadow.js` | Shared non-interactive grounding effect |
| `interactions/IngredientSelection.js` | Collider metadata, selection intent and accessibility bridge |

These are **proposals, not existing files**. Do not create a new architecture solely to satisfy documentation; refactor when the additional farm zones create justified reuse, and keep screenshot/regression coverage.

### 4.3 Sourcing and asset acceptance

- Use simple procedural geometry for Phase 0 and early asset variations.
- If Blender/GLB is added later, preserve the silhouette, scale, anchor point and collider contract rather than relying on implicit model origin.
- Keep origin conventions consistent: local model root at ground-facing anchor when practical; document the lowest solid point for grounded positioning.
- Generate/front-side-top orthographic asset screenshots at a fixed scale for review; match the approved three-view sheets as a *modelling reference*, never texture-map those reference images.
- Record model ID, source file, colour/material roles, origin convention, dimensions, render cost and versions for each exported GLB.
- Static decorative meshes must never carry `ingredient`/stock metadata.

## 5. Reusable mobile UI elements — existing Phase 0

| Element / conceptual ID | Existing DOM/CSS source | Behaviour now | Variants / contract |
| --- | --- | --- | --- |
| `ui/app-header` | `.topbar`, `.brand` | Branding, tagline, Settings icon | One compact header with high-contrast title |
| `ui/icon-action` | `.icon-button` | Opens Settings bottom sheet | Minimum ~44px, named accessible label |
| `ui/chicken-dialogue` | `.chicken-message`, `.chicken-bubble` | Non-blocking localized tip | Decorative emoji + semantic text; do not occlude crops |
| `ui/plot-label` | `.plot-label` | Identifies tomato garden | Compact, cream, non-interactive |
| `ui/primary-farm-action` | `.pill-button.primary` | Opens tomato inspection | Coral, high-contrast, clear pressed/focus state |
| `ui/secondary-farm-action` | `.pill-button.back-button` | Returns to overview when focused | Neutral/cream, contextual |
| `ui/main-tabs` | `.bottom-nav`, `.nav-item` | Farm active; other destinations disabled | Three positions only; honest disabled state |
| `ui/ingredient-inspector` | `.ingredient-sheet`, `.ingredient-row`, `.info-tiles` | Tomato details, close/return | Modal, focus management, no stock or harvest claims |
| `ui/settings-sheet` | `.settings-sheet`, `.language-option` | Switch `en` ↔ `zh-CN`, persistence | Immediate update; radio labels; dismissable |
| `ui/webgl-fallback` | `.fallback` | Non-3D tomato details | Full functional fallback for currently supported feature |

**Existing behaviour sources:** `public/phase0/index.html`, `styles.css`, `i18n.js`, `scene.js`.

### Modal and action states

- **Default:** visible affordance and accessible label.
- **Pressed:** subtle ~1px movement for buttons; does not alter stored data.
- **Focused:** 3px visible keyboard outline.
- **Selected tomato:** focused camera + ingredient sheet + contextual Back to Farm.
- **Disabled:** unavailable destinations are explicitly disabled and say *Coming soon*.
- **Fallback:** if Three.js fails to load or WebGL context is lost, show usable non-3D inspector action.
- **Language:** English first launch; user choice stored in `kitchen-garden.locale`, Chinese available instantly.

**Do not create additional permanent bottom tabs** for My Basket or recipes. The approved future navigation is Farm, Today's Meals, Pantry.

## 6. Future reusable elements — specified but NOT built

These components are part of the product direction and must not be treated as current functionality:

| Future element | Visual/UX contract | Dependency |
| --- | --- | --- |
| `ui/harvest-sheet` | Ingredient name, true stock, batch source, quantity, confirm | Inventory domain + reservations |
| `ui/basket-chip` | Accessible basket count from confirmed reservations | Basket state |
| `ui/basket-list` | Reserved ingredients, adjust and release actions | Reservation ledger |
| `ui/meal-card` | Breakfast/lunch/dinner, recipe, shared meal, two portion details | Curated recipe/meal planner |
| `ui/recipe-details` | Ingredient availability, two-person quantities, cooking steps | Recipes + allocations |
| `ui/confirm-cooked` | Review actual ingredient usage and final deduction | Idempotent cooking command |
| `ui/pantry-item` | Real on-hand, reserved/available, unit, source, correction | Authoritative inventory |
| `ui/organic-source-chip` | Explicit organic / non-organic / unknown; no implied claims | Batch-level sourcing |
| `zone/{vegetable,protein,fish,fruit,grain}` | Unified island-style interactive ingredient areas | Phase 3 world expansion |

Future status states `READY`, `HARVESTING`, `EMPTY`, `REGROWING`, `OUT_OF_STOCK` and `BLOCKED` are documented in `docs/specs/KITCHEN_GARDEN_GAME_LOGIC.md`. They **must not be confused with the current tomato-inspection animation**. Harvesting reserves quantities, cooking deducts physical stock; presentation never changes stock.

## 7. Camera / interaction integration contract

- The renderer and camera live in `scene.js`; the world builder returns `root`, `colliders`, `fruitPositions`, `update` and `assets`.
- Camera is orthographic; overview and selected ingredient view are separate. An item is selected by raycasting against `farm.colliders`, not all visible objects.
- Pointer movement over 13px cancels a tap to reduce accidental selections while panning.
- The selected 3D ingredient remains in view above the bottom sheet. Close, Back to Farm, keyboard Escape and fallback should remain available.
- 3D selection is an **intent**; if future stock writes fail, UI must not pretend the ingredient has been reserved or consumed.
- New elements should have semantic IDs and translation keys, and equivalent DOM paths for users who cannot use WebGL.

## 8. Scaling, grounding, performance and accessibility

### Spatial conventions

- All dimensions are in Three.js world units. House and chicken are toy-scale references, not real-world metres.
- Grass top = `0.43`; tomato soil top = `0.62`. Use `grassSurfaceY` and `groundedRootY`, **including bevel and scale**, not eyeballed Y offsets.
- Treat model + collider + local contact shadow as one reusable **asset specification**, even though they are currently built by multiple local functions.
- Keep trees out of the camera/ingredient sightline; keep house/chicken/tomato size balance consistent.

### Rendering budget

- Current renderer caps `devicePixelRatio` at `1.55`, uses `PCFSoftShadowMap` with `1024×1024` shadow map and roughly 32fps target update loop. These are implementation settings, **not measured iPhone performance**.
- Share geometry, materials, and contact textures; do not add separate large textures for each clone.
- Use fewer, bigger foliage forms; avoid dense per-blade grass, glossy effects, expensive post-processing and busy particle effects.
- Provide a no-WebGL path and respect `prefers-reduced-motion`.
- All essential touch actions need visible, accessible DOM alternatives and approximately >=44px touch targets.

## 9. Reuse / extension checklist for Codex

Before introducing a new 3D model, screen, or component:

1. Locate its visual parent and current implementation in the inventory above.
2. Reuse the existing material family, rounding, spacing, shape language and shadow rules.
3. Describe new variants and dimensions; keep model roots grounded.
4. Confirm whether it is **decorative** or **interactive**. Only interactive resources get collision metadata.
5. Declare English/Chinese visible strings together; check long Chinese labels.
6. Test focused vs overview camera, 320/375/390/430 and desktop framing.
7. Capture actual WebGL front, side, top and default-gameplay frames where geometry changes.
8. Verify no false inventory/recipe capability is implied.
9. Update this document and [Design Styles](./DESIGN_STYLES.md) if the design system evolves.
10. Ship through a review branch with tests; do not overwrite `main` or promote production without approval.

## 10. Review status

**Implemented:** interactive tomato inspection; clay island, pink house, hen, crop bed, trees, scenery and grounding; HTML UI; English/Chinese language; WebGL fallback.

**Not implemented:** actual stock-linked harvesting, basket reservations, other ingredient zones, meal planning, cooking confirmation, two-device sync, reusable exported 3D asset modules.

**Still necessary for final asset sign-off:** capture real WebGL front/side/top screenshots, visual comparison to the approved asset boards, and actual physical-device iPhone Safari input/FPS verification.

**Documentation rule:** update this catalogue after a **working implementation** changes a component; don't claim a proposed element already ships. Existing code is authoritative for real model/DOM APIs.
