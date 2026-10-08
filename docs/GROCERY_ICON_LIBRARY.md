# Kitchen Garden — Reusable Grocery Icons (Step 02)

**Status:** Implemented in a development branch. **Not** a 3D model library. The icon set consists of self-contained SVG markup with clay-like gradients, round shapes and soft shadows. These are small 2D UI assets that complement, but never replace, the real Three.js farm.

## Implemented

- `public/phase0/ingredient-icons.js` exports `INGREDIENT_ICON_IDS` and `ingredientIconMarkup(id)`.
- Current supported visual IDs: `tomato`, `egg`, `bokchoy`, `carrot`, `potato`, `onion`, `garlic`, `mushroom`, `fish`, `chicken`, `rice`.
- Icon size is controlled by `.kg-food-icon` in `public/phase0/styles.css` (32px default; 52px ingredient sheet; 34px basket; 27px list).
- Current active ingredient types in the **inventory domain remain tomato and egg only**. The other nine icons are visual assets for future ingredient expansion, not working groceries.
- The live ingredient sheet, basket rows, pantry rows and recipe ingredients use these shared icons. The 3D world remains unchanged.

## Usage

```js
import {ingredientIconMarkup} from './ingredient-icons.js';
const icon = ingredientIconMarkup('tomato'); // sanitized known ID only
```

The SVG is decorative (`aria-hidden`); always provide an adjacent accessible ingredient name. Do not pass untrusted IDs or user content to an HTML injection sink. The library returns an empty string for unknown IDs. Each icon has its own gradient identifier to avoid collisions when repeated in lists.

## Style rules

- Round matte silhouettes, warm soft shading, no photographic textures.
- Ingredient identity must remain recognizable at 27–34px.
- Never use an icon as proof of actual food stock, freshness or organic certification.
- Future unavailable/selected states should be implemented as accessible wrappers, not by silently recolouring food as rotten.
- Retain the green action palette and the original 3D farm palette.

## Follow-up

**Step 03:** actual interactive empty plot in Three.js with large + hit target, tomato/egg restock sheet and accessible fallback. Validate the farm in real WebGL before claiming fidelity to the approved image.
