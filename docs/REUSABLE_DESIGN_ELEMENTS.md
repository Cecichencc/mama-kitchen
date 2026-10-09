# Kitchen Garden — Reusable Design Elements v2.0

**Baseline:** `feature/kitchen-garden-flat-svg-art-20261009`. **Updated:** 2026-10-09. A catalogue of real current components and proposed reuse contracts; not a published component library.

## Layer 1 — UI components

| Conceptual ID | Actual source | Contract |
| --- | --- | --- |
| `ui/primary-button` | `.cta-button`, `.pill-button.primary` | Green, 48px+, default/pressed/disabled/focus |
| `ui/secondary-button` | `.pill-button:not(.primary)` | Cream, soft green outline |
| `ui/quantity-stepper` | `.stepper`, `.kg-basket-stepper` | Large +/- hit areas, min/max validation |
| `ui/ingredient-sheet` | `#ingredientSheet` | Name, sourcing, quantity, Add to Basket |
| `ui/basket-row` | `.basket-line` | Icon, source, quantity controls, remove |
| `ui/pantry-form` | `#groceryForm` | Quantity, organic source, storage, date |
| `ui/recipe-card` | `.kg-recipe-card` | SVG dish, title, minutes, availability, View Recipe |
| `ui/recipe-detail` | `#kgRecipeDetail` | Same dish art, ingredients, steps, favourite |
| `ui/recipe-filter` | `.kg-recipe-filters` | All/Breakfast/Lunch/Dinner |
| `ui/main-nav` | `.bottom-nav` | Farm / Today's Meals / Pantry |
| `ui/webgl-fallback` | `#fallback` | Accessible alternative when 3D fails |

Current UI uses HTML/CSS/JavaScript. These conceptual IDs are not exported React components.

## Layer 2 — Flat SVG design elements

**Grocery icon API:** `ingredientIconMarkup(id)` and `INGREDIENT_ICON_IDS` in `public/phase0/ingredient-icons.js`.

Current IDs: `tomato`, `egg`, `bokchoy`, `carrot`, `potato`, `onion`, `garlic`, `mushroom`, `fish`, `chicken`, `rice`.

**Recipe art API:** `recipeArtMarkup(id)` and `RECIPE_ART_IDS` in `public/phase0/recipe-art.js`.

Current IDs: `tomato-egg`, `bokchoy-garlic`, `mushroom-rice`, `salmon-bowl`, `pumpkin-soup`, `egg-breakfast`, `tomato-soup`.

Shared visual parts: tomato wedge, scrambled egg, leaf, rice, mushroom, salmon, pumpkin, chicken, cream plate/bowl and grounded ellipse. These are currently composed inside `recipe-art.js`, not separately published exports.

**Contracts:** grocery icon 64×64 flat SVG; recipe illustration 320×240 layered SVG. No binary WebP files needed. Always use the same art for the same recipe ID. Decorative SVGs are `aria-hidden` and accompanied by text. Visual assets do not create inventory or recipe-feasibility support.

## Layer 3 — Three.js game assets

| Conceptual ID | Actual implementation | Reuse contract |
| --- | --- | --- |
| `world/island` | `roundedPlatform` in `world.js` | Rounded sage island, grounded terrain |
| `crop/tomato` | local `tomato()` | Resting round red fruit, short green crown, large collider |
| `building/farmhouse` | `house` group | Blush-pink walls, pitched rose roof, cream door |
| `character/chicken` | `hen` group | White rounded hen, feet planted, head/wing idle |
| `vegetation/tree` | local `tree()` | Short trunk, rounded foliage, terrain-aware placement |
| `prop/crate` | `crate` group | Decorative; fruit does not represent stock |
| `prop/fence` | local `fenceLine()` | Short planted posts, light rails |
| `prop/path` | `steps` | Embedded pale stones |
| `fx/contact-shadow` | local `contactShadow()` | Small shared texture, no floating illusion |
| `interaction/empty-plot` | `restockMarker()` | 3D green +, oversized hit collider, Pantry shortcut |
| `interaction/crop-collider` | `colliders` array | Tap selects; drag does not accidentally select |

The current builders are local functions inside `createPastelWorld`, **not** separately exported modules. Proposed future extraction into `assets/{materials,primitives,Tomato,Farmhouse,Chicken,Tree,Environment,ContactShadow}.js` requires a dedicated tested implementation PR.

## Component state and behaviour

- Farm: default overview, panning/zooming, focused ingredient, empty/restocking, no-WebGL fallback.
- Basket: selected, quantity change, remove, recipe discovery; **temporary reservation logic still exists**, pending migration to selection-only.
- Recipe: available tracked ingredients, missing tracked ingredients, unknown untracked ingredients; favourite on/off; Another Idea.
- Pantry: source organic/non-organic/unknown; quantity correction; empty stock.
- UI: default/pressed/focus/disabled/loading as relevant. Do not invent working states not supported by code.

## Extension checklist for Codex

1. Read [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), [DESIGN_STYLES.md](./DESIGN_STYLES.md) and [AI_DESIGN_GUIDELINES.md](./AI_DESIGN_GUIDELINES.md).
2. Inspect actual source; never assume a conceptual ID is an importable module.
3. Reuse existing tokens and SVG food shapes before adding new variants.
4. Keep 2D food icons flat, recipe art layered, 3D world real and grounded.
5. Separate visual animations from inventory transactions.
6. Add English and Chinese labels; preserve keyboard and fallback accessibility.
7. Test mobile widths, WebGL gesture interactions, visual proportions and recipe matching.
8. Update documentation only after actual code changes; use draft PR and no production merge without approval.
