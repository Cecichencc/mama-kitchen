# Kitchen Garden — Design Styles v2.0

**Approved visual language:** Soft Pastel Toy World, with a real 3D farm, flat 2D food icons and layered 2D recipe illustrations. **Updated:** 2026-10-09. This is documentation, not a claim of completed token refactoring.

## Current runtime tokens

| Role | Value | CSS token |
| --- | --- | --- |
| Primary action | `#4CAF7A` | `--kg-primary` |
| Pressed action | `#2F7D46` | `--kg-primary-pressed` |
| Soft green | `#E8F4EA` | `--kg-primary-light` |
| Cream | `#FFF9F2` | `--kg-cream` |
| Background | `#F7FAFD` | `--kg-background` |
| Pink | `#FFD9E0` | `--kg-pink` |
| Blue | `#E3F2FF` | `--kg-blue` |
| Main UI text | `#2D3748` | `--kg-text` |
| Secondary text | `#8A94A6` | `--kg-text-secondary` |
| Border | `#E5E7EB` | `--kg-border` |

**3D palette:** sky `#C9EAE6`, grass `#B7D9A8`, house `#E89CB0`, tomato `#FF6B5B`, deep-green ink `#315A50`. CSS legacy grass `#A8C896` and barn `#DB91A6` differ from the 3D palette; do not silently recolour the approved world.

## UI specifications

- Existing font stack: `ui-rounded, "Nunito", system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`.
- Current control minimum height: `48px`; control radius `16px`; card radius `20px`; sheet top radius `28px`.
- Existing card elevation: `0 5px 18px rgba(45,55,72,.08)`.
- **Proposed** spacing scale (not fully tokenised): 4, 8, 12, 16, 24, 32px.
- Primary actions: green, pressed dark green, disabled visibly muted; accessible focus ring. Secondary: cream and subtle green outline.
- Recipe cards: 2D SVG art, name, time, honest availability, View Recipe and favourite. No Start Cooking.
- Ingredient sheet: name, source, quantity and Add to Basket. No detailed stock totals on farm.
- Keep 3 navigation tabs: Farm, Today's Meals, Pantry.
- Test contrast, 44px touch targets, English/Chinese text and 320/375/390/430px mobile widths.

## Flat grocery icons

- Source: `public/phase0/ingredient-icons.js`.
- Simple filled SVG silhouettes, 64×64 viewBox, no faux-3D shading, radial gradients or drop-shadow filter.
- Transparent background; display around 24–48px, inside sufficiently large touch targets.
- Reuse the same icon in Pantry, Basket and ingredient details; adjacent text provides the accessible name.
- Existing icon catalogue includes tomato, egg, bok choy, carrot, potato, onion, garlic, mushroom, fish, chicken and rice. Only tomato and egg have implemented inventory types.

## Layered recipe illustrations

- Source: `public/phase0/recipe-art.js`.
- 320×240 SVG viewBox with reusable food shapes, plate/bowl composition and soft grounded ellipse.
- Consistent flat colours, gentle overlaps, no photorealistic texture or external binary image.
- Same recipe ID maps to the same art in card and details; use a neutral fallback for an unillustrated dish.
- Current compositions: tomato-egg, bokchoy-garlic, mushroom-rice, salmon-bowl, pumpkin-soup, egg-breakfast, tomato-soup.
- Artwork is decorative and must not imply a recipe is feasible.

## Real 3D farm

- Three.js scene remains actual geometry; matte clay-like surfaces, rounded terrain, small tomato crops, white hen, pink house.
- Grounding: `grounding.js` grass height `0.43`, tomato soil `0.62`; preserve planted feet, small contact shadows, soft directional light and 1024×1024 shadow map.
- Keep camera angle constrained. One-finger pan, pinch/wheel zoom, tap to select, double-tap empty area to reset.
- No permanent farm HUD resource buttons, quantities, back control, add-food hints or chicken dialogue. Accessible fallback still necessary.
- Empty 3D plot/nest shows green + and opens preselected Pantry. Crop regrowth is presentation, never inventory creation.
- Respect reduced motion and WebGL failure.

## Data and release safeguards

- English default, Simplified Chinese selectable; add both strings for every new control.
- Recipe browsing never deducts stock. Temporary basket reservations still exist in code and are a known future refactor.
- Don't assert untracked ingredients are available. Preserve organic/non-organic source labels.
- Validate with real WebGL screenshots and physical iPhone Safari before visual acceptance.
- Current code is authoritative for runtime values; this document defines approved intent. Keep [REUSABLE_DESIGN_ELEMENTS.md](./REUSABLE_DESIGN_ELEMENTS.md) updated.
