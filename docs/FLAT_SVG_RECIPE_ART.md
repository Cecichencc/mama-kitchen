# Kitchen Garden — Flat Grocery Icons and SVG Recipe Art v1.1

**Implementation:** Development branch, no production merge.

## Visual architecture
- `public/phase0/ingredient-icons.js`: reusable flat SVG grocery icons, without radial gradients or simulated 3D shading.
- `public/phase0/recipe-art.js`: reusable SVG ingredient shapes, plate/bowl compositions and 19 code-generated recipe illustrations.
- `public/phase0/recipe-discovery.js`: recipe cards and details both render the same vector art by recipe ID; no external image or binary asset needed.
- `public/phase0/styles.css`: responsive scalable SVG layout and flat-icon appearance.

## Current recipe art
19 stable recipe IDs. The original eight: `tomato-egg`, `bokchoy-garlic`, `mushroom-rice`, `salmon-bowl`, `pumpkin-soup`, `egg-breakfast`, `steamed-egg`, `tomato-soup`; plus eleven new compositions in [HOME_RECIPE_LIBRARY_V1.md](./HOME_RECIPE_LIBRARY_V1.md).

## Rules
- The live Three.js farm remains unchanged.
- Recipe art is illustrative and does not represent verified inventory availability.
- Recipe details and cards reuse the same ID-mapped artwork.
- Add new dishes by composing existing food shapes and extending the recipe-ID map; no binary upload.
- Keep ingredient names accessible in adjacent text; SVG illustrations are decorative.
- The previous WebP mapping has been replaced; existing WebP images are not required.

## Review gates
- Check rendering at 320/375/390/430px and desktop.
- Verify SVG rendering in iPhone Safari, including recipe cards and full details.
- Verify no horizontal overflow, focus issues or missing recipe IDs.
- Run existing CI tests; visually compare against the approved flat-2D direction.
- Do not merge to production until reviewed.

## Extension specification

When adding a recipe, create a stable bilingual catalogue record, assign truthful unit-aware ingredient requirements, compose an SVG with reusable ingredient shapes, and add an automated mapping test. The same art must be used in the recipe list, Today's Kitchen and details. New assets remain code-only; no WebP upload required.
