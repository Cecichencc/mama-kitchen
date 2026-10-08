# Kitchen Garden — Design Styles

**Version:** 1.0 — 2026-10-08  
**Status:** Documented design contract, based on the approved, grounded Phase 0 farm. **Documentation only:** this change does not refactor CSS/Three.js.  
**Audited implementation:** `feature/kitchen-garden-grounded-shadows-20261008` at `6caa52c`.  
**Companion:** [Reusable Design Elements](./REUSABLE_DESIGN_ELEMENTS.md) · [Design System Index](./DESIGN_SYSTEM.md).

## 1. Visual identity and principles

**Art direction:** **Soft Pastel Toy World**. A small, interactive, handcrafted miniature farm: matte clay-like 3D objects, gentle daylight, friendly animal companion, green terrain, blush-pink farmhouse and simple, welcoming cream UI.

1. **Game world first.** The 3D farm is the main content; overlays should be compact and contextual.
2. **Soft, not blurry.** Rounded silhouettes and gentle light; actual surfaces and shadows must maintain physical contact.
3. **Readable over decorative.** Deep-teal type, sufficient contrast, simple controls and large touch targets.
4. **Real geometry.** Gameplay assets are meshes (procedural or GLB), not flat pictures or CSS stand-ins.
5. **Calm motion.** Selection and camera cues are subtle and optional under reduced motion.
6. **One shared visual vocabulary.** Reuse crop shapes, foliage, materials, shadows and UI roles rather than reinventing a style for each zone.
7. **Honest game state.** Decorative produce does not indicate real grocery quantity, freshness or availability.

**Avoid:** saturated orange fills, glossy plastic, chrome, photorealistic textures, noisy ground detail, spindly plants, tall tomato stems, hard-edged toy blocks, huge soft shadows that imply hovering, unbounded camera rotation, dense HUDs and inaccessible 3D-only actions.

## 2. Colour roles and implemented tokens

These values are **read from the current files**. A repeated colour in CSS and 3D is not automatically a unified runtime token.

### 2.1 DOM / CSS tokens — `public/phase0/styles.css`

| Token | Hex or current CSS | Use |
| --- | --- | --- |
| `--sky` | `#C9EAE6` | Outdoor sky / canvas backdrop |
| `--grass` | `#A8C896` | UI-side grass reference |
| `--hills` | `#B9D5A7` | Background hill colour |
| `--barn` | `#DB91A6` | UI-side blush barn reference |
| `--surface` | `#FAF5EA` | Warm cream sheets |
| `--ivory` | `#FFFCF7` | Lighter cards, header and navigation |
| `--flower` | `#F2D98D` | Gentle yellow detail |
| `--water` | `#91D5DD` | Decorative blue-green water |
| `--coral` | `#EB8068` | Main actions only |
| `--coral-dark` | `#CF644F` | Active navigation and stronger coral |
| `--ink` | `#315A50` | Primary text and focus ring |
| `--muted` | `#657B73` | Secondary text |
| `--border` | `#DFE7DA` | Light UI dividers |
| `--focus` | `#315A50` | Keyboard focus outlines |
| `--shadow` | `0 10px 30px rgba(41,84,73,.15)` | Existing shared elevation reference |
| `--radius-xl` | `28px` | Large rounded containers |
| `--radius-md` | `18px` | Medium rounded containers |

The current CSS also includes literal values for gradients, surfaces, cards and controls. Those **are not yet fully normalized** as tokens; migrate carefully in a separate UI implementation change, not during a documentation-only update.

### 2.2 Three.js material palette — `public/phase0/world.js`

The `WORLD_COLORS` object currently exposes these foundational roles:

| Material role | Current value | Typical asset |
| --- | --- | --- |
| `sky` | `#C9EAE6` | Atmospheric fog |
| `grass` | `#B7D9A8` | Top island platform |
| `distantHills` | `#B9D5A7` | Distant green hills |
| `house`, `barn` | `#E89CB0` | Farmhouse wall |
| `houseRoof`, `barnRoof` | `#D16B84` | Gabled roof |
| `tomato` | `#FF6B5B` | Tomato body |
| `tomatoLeaf` | `#7CC67A` | Five tomato crown leaves |
| `soil` | `#A67C52` | Raised bed |
| `cream` | `#FFF8EC` | Frames and accents |
| `ivory` | `#FFFCF7` | Pale material references |
| `white` | `#FFFFFF` | Hen body, petals |
| `water` | `#91D5DD` | Blue window/water materials |
| `flowers` | `#F2D98D` | Flower centers |
| `text` | `#315A50` | Palette reference only |
| `action` | `#EB8068` | Palette reference only |

The `M` material map inside `createPastelWorld` contains further clay shades (e.g. pale grass `#C9E3B5`, dark foliage `#5E9D76`, trunk `#92705D`, timber `#B59070`, pale path `#FFF1D4`, stone `#E8DEBB`). Use existing `M` material roles to preserve a consistent environment.

**Known divergence to resolve in a future token refactor:** CSS grass is `#A8C896` while model grass is `#B7D9A8`; CSS barn is `#DB91A6` while model farmhouse is `#E89CB0`. This is a **documented cross-medium difference**, not an instruction to silently recolour the approved 3D scene.

### 2.3 Semantic colour application

- **Environment:** mint-blue sky + light sage topsoil; accents do not cover the whole screen.
- **Architecture:** blush pink and muted rose; cream framing.
- **Ingredients:** recognizable produce colours with only subtle clay variations.
- **UI content:** teal typography on warm cream / ivory, not text laid directly over busy foliage.
- **CTA:** coral is reserved for the primary action; avoid several competing coral buttons.
- **Focus and status:** use high-contrast teal focus treatments; future states must have explicit text or icons, not colour alone.

**Contrast audit required before sign-off:** confirm small text, especially white text on coral buttons and muted text on translucent panels, reaches appropriate WCAG contrast. Existing colours are reference values, **not proof of accessibility compliance**. Where necessary, adjust the foreground or darken the button state without changing the intended palette identity.

## 3. Typography, sizing and layout

**Implemented font stack:** `ui-rounded, "Nunito", system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`. It uses local/system fallbacks; there is no bundled proprietary font.

**Current observed type examples:**

| UI role | Existing reference |
| --- | --- |
| App name | `clamp(20px, 4.7vw, 27px)`, heavy weight |
| Tagline | 11px |
| Chicken message | 13px bold |
| Plot label | 12px bold |
| Primary pill | 14px bold; min-height 49px |
| Bottom navigation | 12px, with 26px icon |
| Ingredient title | 25px |
| Settings title | 24px |

**Future guidance (not currently tokenized):** adopt a 4px spacing basis with a compact scale `4 / 8 / 12 / 16 / 24 / 32` px. Prefer >=16px body copy on forms and key recipe content; allow clear typographic expansion for Chinese text and larger accessibility settings. Avoid text truncation in meal descriptions.

**Applied layout:**
- `.topbar`: 76px nominal height (66px at <=360px), light ivory.
- `.farm-stage`: fills the main view using viewport-aware sizing with a minimum height.
- `.scene-controls`: floated above the three-tab bottom navigation, including safe-area padding.
- `.bottom-nav`: exactly **Farm / Today's Meals / Pantry**; latter two are disabled / marked *Coming soon* in Phase 0.
- `.ingredient-sheet` and `.settings-sheet`: fixed bottom sheets, width capped at 540px, 28px top corners, safe-area padding; a close control must be clearly reachable.

Use responsive review widths of **320, 375, 390, 430px**, then tablet and desktop. Avoid tall headers and persistent explanation copy over the farm. Keep small controls clear of the iPhone bottom gesture region.

## 4. 3D shape and material rules

| Aspect | Style contract |
| --- | --- |
| Rendering | Real Three.js WebGL, not a background image |
| Silhouette | Toy-like, softened corners, slightly flattened spheres and rounded forms |
| Surfaces | `MeshStandardMaterial` matte look; current material factory uses roughness `0.91`, metalness `0` |
| Texture | Prefer material colour and geometry; no noisy photographic textures |
| Island | One compact beveled, rounded rectangle with visible earthy lower layer |
| Vegetation | Reused rounded crown clusters and short trunks; no large tree occlusion |
| Tomato | Squashed round fruit + five small leaves + short crown stem, resting on soil |
| Hen | White pear-like body, expressive small features, stationary planted feet |
| House | Blush walls, pitched muted-rose roof, arched cream door, light window details |
| Repetition | Shared basic primitives/materials; slight scale and orientation variation |
| Decoration | Small stones, bushes, grass tufts, flowers, fences; never hide the crop tap target |

### Ground-contact and lighting contract

The Phase 0 shadow-grounding work is approved as the baseline, not a new proposed visual effect:

- `public/phase0/grounding.js` defines `GROUND_LEVELS.grass = 0.43` and `GROUND_LEVELS.tomatoSoil = 0.62` (world units), with `grassSurfaceY(x,z)` for rounded mounds and `groundedRootY(surface, lowestLocalY, scale, embed)` for object roots.
- The current key light is at `(-3.6, 11.5, 5.1)`, targeting `(0, .58, 0)`. Hemisphere fill intensity is `1.6`; directional intensity `2.05`.
- Real PCF soft shadows use a `1024×1024` map and shadow frustum bounds `±6.2`; bias `−0.00005`, normalBias `0.006` and radius `1.6`.
- A shared **64×64 radial CanvasTexture** adds tiny local contact darkening under important grounded items (house, tree feet, tomato, chicken, crate). It supplements cast shadows; it does not replace them.
- Do not animate the chicken's root vertically; animate subtle head/wing motion instead.
- Avoid large blurred shadow decals, strong lateral displacement, visible z-fighting, float gaps and deep mesh intersections.

**Review requirement:** before changing light angles, ground heights, geometry scale or camera framing, compare actual WebGL front/side/top renders and a mobile overview. The screen must still read as the approved miniature farm.

## 5. Camera, motion and feedback

**Implemented in `public/phase0/scene.js`:**
- Orthographic camera, elevated overview with camera offset `(7.4,9.4,12.0)`.
- Overview look target approximately `(-0.16,0.68,0.10)`.
- Viewport-aware framing via `ResizeObserver`; do not hardcode a single portrait framing for all phones.
- Selected-tomato camera zoom target `1.56`, with focus aligned so the fruit remains above the bottom sheet.
- Pointer raycasts against dedicated invisible tomato colliders; rejecting touch movement exceeding 13 CSS px.
- Light tomato selection motion and gentle chicken head/wing idle movement.
- `prefers-reduced-motion` removes cosmetic animation while preserving inspect / return.
- Renderer uses `devicePixelRatio` capped at `1.55`; animation is throttled to roughly 32 frames/sec in this Phase 0 controller. This is **not a measured device FPS**.

**Motion targets for future work** *(proposal, not implemented)*: ~150–250ms button feedback, ~250–450ms local selection transitions and ~350–650ms camera moves; honor reduced motion and profile on real devices. Do not tie visual animation completion to inventory mutations.

## 6. Accessible interaction and localization

- Tap a 3D ingredient or use a visible DOM action. Never require hover or a joystick.
- Buttons and inputs should be about **44×44 CSS px minimum**, including adequate spacing; current primary pill meets 49px min height.
- Focus-visible is already styled with a 3px teal outline and 3px offset.
- When a sheet opens, focus moves inside. Escape closes; Tab stays within its actionable content; closing restores focus.
- WebGL load/context failure displays accessible text-based tomato inspection, not a broken blank screen.
- Text should not be drawn into the 3D canvas when it needs to be read by a screen reader.

**Language contract:** English (`en`) is the default on first launch; users can switch to Simplified Chinese (`zh-CN`) from **Settings → Language**. The chosen locale persists where storage is allowed via `kitchen-garden.locale`. Use `public/phase0/i18n.js` translation dictionaries and `data-i18n`, `data-i18n-aria`, `data-i18n-title`, with English fallback. Never introduce a new visible label without adding both language entries.

## 7. Semantic components and CSS usage

Current UI classes / visual roles:

| Role | Existing classes | Required behaviour |
| --- | --- | --- |
| Header / identity | `.topbar`, `.brand`, `.icon-button` | Small, clear, accessible Settings |
| World | `.farm-stage`, `.three-mount` | Real Canvas scene is the focus |
| Guide / label | `.chicken-message`, `.chicken-bubble`, `.plot-label` | Short helper guidance; avoid crop occlusion |
| Action | `.pill-button`, `.pill-button.primary`, `.cta-button` | Visible tap/focus/disabled feedback |
| Navigation | `.bottom-nav`, `.nav-item` | Three slots, disabled features look disabled |
| Ingredient detail | `.ingredient-sheet`, `.ingredient-row`, `.info-tiles` | Modal, close/return, no invented stock |
| Preferences | `.settings-sheet`, `.language-option` | Switch immediately without reload |
| Fallback | `.fallback` | Useful without WebGL |

For future meal cards, basket, pantry and stock badges: use these semantic roles and colour/spacing guidance but **do not document them as already built**. Distinguish `planned` from `implemented` in component tables.

## 8. Design review / acceptance checklist

- [ ] Mobile farm is the focal point; island fits at 320/375/390/430 and desktop without blocking important crops.
- [ ] Tomato fruit, chicken, farmhouse and scenery remain physically attached to terrain.
- [ ] Matte, rounded pastel clay shapes look coherent from front, side and top.
- [ ] Cream sheets and dark teal text have readable contrast; CTA contrast is checked.
- [ ] Tomatos are easily selectable via generous hit volumes; sheet opens/closes; camera returns to overview.
- [ ] English and Simplified Chinese layouts fit; language persists.
- [ ] Keyboard control, reduced motion and no-WebGL fallback are usable.
- [ ] No unimplemented inventory/meal functions are presented as available.
- [ ] Screenshot comparisons use **actual WebGL** renders, not generated illustrations.
- [ ] Test on physical iPhone Safari before declaring mobile visual or FPS acceptance.

## 9. Source-of-truth and future evolution

| Concern | Current authority |
| --- | --- |
| Approved product/UX requirements | `docs/specs/KITCHEN_GARDEN_PRD.md` |
| Inventory invariants | `docs/specs/KITCHEN_GARDEN_GAME_LOGIC.md` |
| Delivery sequence | `docs/specs/KITCHEN_GARDEN_3D_BUILD_PLAN.md` |
| UI CSS values | `public/phase0/styles.css` |
| Live 3D materials/geometries | `public/phase0/world.js` |
| Real lighting/camera | `public/phase0/scene.js` |
| Ground contact | `public/phase0/grounding.js` |
| Translation/copy | `public/phase0/i18n.js` |

The docs describe the approved direction; **implemented code remains authoritative for the current actual values** until a future, separately tested refactor moves all palette values into shared runtime tokens.

Changes affecting composition, palette, grounding, touch targets or language must update this file and [Reusable Design Elements](./REUSABLE_DESIGN_ELEMENTS.md), and be visually checked in actual WebGL.
