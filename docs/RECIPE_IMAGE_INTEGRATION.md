# Kitchen Garden — Recipe Image Integration

**Status:** Recipe-image crops generated from the approved visual board and supplied as a downloadable ZIP; code integration committed on a development branch. **Binary WebP files have not yet been uploaded into GitHub**, so the preview currently falls back to symbols until the files are copied to `public/phase0/recipes/`.

## Five image files
- `tomato-egg-stir-fry.webp` → recipe `tomato-egg`
- `garlic-bok-choy.webp` → recipe `bokchoy-garlic`
- `chicken-mushroom-rice.webp` → recipe `mushroom-rice`
- `salmon-vegetable-bowl.webp` → recipe `salmon-bowl`
- `pumpkin-soup.webp` → recipe `pumpkin-soup`

These are **cropped from the approved composite visual board** (about 280×296 px each), not newly generated 1024px individual masters. They are appropriate for first-pass mobile card review, but should be replaced with higher-resolution masters before final release.

## Runtime contract
- `recipe-discovery.js` maps stable recipe IDs to `./recipes/<filename>.webp`.
- One image is reused across recipe cards and recipe details, with `object-fit:cover`.
- On missing image or load error, the UI displays its existing symbol.
- Other recipes continue using symbols until approved images exist.
- No runtime image generation, no image-based inference of inventory, no cooking confirmation.

## Deployment requirement
Upload the five WebP files from the ZIP to `public/phase0/recipes/` on this branch, then run the build and inspect the mobile preview. The GitHub text-file connector cannot directly upload the locally created binary files, so they have **not** been committed as part of this change.

## QA
- Verify each mapped recipe loads its image with HTTP 200 after upload.
- Verify fallback works without image files.
- Check 320/375/390/430px and desktop crops.
- Check images remain decorative and accessible recipe names are readable.
- Keep production unchanged until approved.
