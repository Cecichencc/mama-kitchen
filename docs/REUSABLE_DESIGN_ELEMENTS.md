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
| `ui/family-setup-entry` | `#kgFamilySetupBtn` | Optional in-Pantry onboarding entry; preview-only without backend |
| `ui/family-onboarding-dialog` | `#kgFamilyOnboarding` | Accessible English/Chinese email OTP, create/join and invitation flow; disabled remote actions until configured |
| `ui/family-step-nav` | `.kg-family-step-nav` | Compact sign-in/create/join steps, minimum 44px targets |
| `ui/recipe-card` | `.kg-recipe-card` | SVG dish, title, minutes, availability, View Recipe |
| `ui/recipe-detail` | `#kgRecipeDetail` | Same dish art, ingredients, steps, favourite |
| `ui/shopping-entry` | `.kg-shopping-entry` | Optional button on Today's Kitchen showing count of selected recipes |
| `ui/shopping-sheet` | `#kgShoppingSheet` | Mobile bottom sheet/desktop dialog with recipe chips, shortages, check at home, and Pantry handoff |
| `ui/shopping-line` | `.kg-shop-row` | Quantity-aware checklist row with explicit Add to Pantry action |
| `ui/recipe-filter` | `.kg-recipe-filters` | All/Breakfast/Lunch/Dinner |
| `ui/main-nav` | `.bottom-nav` | Farm / Today's Meals / Pantry |
| `ui/webgl-fallback` | `#fallback` | Accessible alternative when 3D fails |

Current UI uses HTML/CSS/JavaScript. These conceptual IDs are not exported React components.

## Layer 2 — Flat SVG design elements

**Grocery icon API:** `ingredientIconMarkup(id)` and `INGREDIENT_ICON_IDS` in `public/phase0/ingredient-icons.js`.

Current IDs: `tomato`, `egg`, `bokchoy`, `carrot`, `potato`, `onion`, `garlic`, `mushroom`, `fish`, `chicken`, `rice`.

**Recipe art API:** `recipeArtMarkup(id)` and `RECIPE_ART_IDS` in `public/phase0/recipe-art.js`.

Current 19 IDs: `tomato-egg`, `bokchoy-garlic`, `mushroom-rice`, `salmon-bowl`, `pumpkin-soup`, `egg-breakfast`, `steamed-egg`, `tomato-soup`, `egg-rice-porridge`, `carrot-egg-pancakes`, `mushroom-egg-soup`, `onion-scrambled-eggs`, `tomato-potato-soup`, `potato-carrot-stir-fry`, `mushroom-bokchoy`, `chicken-potato-stew`, `tomato-fish-soup`, `carrot-egg-fried-rice`, `chicken-carrot-rice`.

Shared visual parts: tomato wedge, scrambled egg, leaf, rice, mushroom, salmon, pumpkin, chicken, carrot, potato, onion, fish, egg pancake, cream plate/bowl and grounded ellipse. These are currently composed inside `recipe-art.js`, not separately published exports.

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

### Home-recipe illustrations (2026-10-09)

Additional recipe data lives in `public/phase0/home-recipes.js`; all compositions reuse the existing `dish`, `scatter`, `at` helpers in `recipe-art.js`. IDs map directly to titles and units in the recipe catalogue. See [HOME_RECIPE_LIBRARY_V1.md](./HOME_RECIPE_LIBRARY_V1.md). None of these illustrations imply stocked groceries or a cookable dish.

## Recipe-to-shopping interaction (2026-10-10)

See [SHOPPING_LIST_V1.md](./SHOPPING_LIST_V1.md). Recipe details reuse the established green CTA style for the optional add-to-list action. The shopping list uses the same cream surfaces, green actions and accessible dialog/focus conventions as existing sheets; it's not a new fourth navigation tab or an overlay on the real 3D farm. The pure reducer `shopping-list.js` and UI adapter `shopping-ui.js` remain distinct. Checkboxes never alter stored inventory.

### Family setup UI (2026-10-10)

The onboarding dialog is built with existing CSS and DOM conventions in `public/phase0/family-onboarding.js`, without replacing the approved 3D farm or three-tab navigation. Feature configuration lives in `family-config.js` and is **off by default**. Credential and backend code must never appear in the design-system asset library. See [FAMILY_ONBOARDING_V1.md](./FAMILY_ONBOARDING_V1.md).
