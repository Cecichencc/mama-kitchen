# Kitchen Garden — Phase 0 shadow and grounding refinement

**Scope:** 3D geometry contact, light/shadow configuration, cosmetic contact occlusion. **No cooking, stock, harvesting, localization or navigation changes.** This work is on a separate review branch and must not be merged to production without approval.

## Diagnosis

- The previous 512×512 directional shadow map spanned 18 world units in each dimension, producing low-resolution, displaced-looking shadows at crop/foot scale.
- `normalBias=0.025` was large relative to the tiny chicken feet and tomatoes, which can visually detach their cast shadow.
- The original key light at `(-5,10,8)` made long horizontal offsets for miniature objects; bright hemispheric fill further washed out their contact.
- The chicken's whole root bounced by 0.02 world units, lifting its feet even when its shadow stayed on terrain.
- Trees were originally placed at a fixed flat-plate height even when situated on raised ellipsoid terrain mounds.
- Tiny decorative flowers had centers at y=0.60, visibly above the grass surface at y=0.43.

## Implemented changes

1. Added `grounding.js` as a pure numeric contract for the grass and raised soil top heights, ellipsoid mound surface evaluation, and model-root anchoring.
2. Tuned the single directional light to a more overhead direction; tightened its frustum to ±6.2 and increased shadow map to 1024×1024 while reducing `normalBias` to 0.006 and `bias` to −0.00005. Soft PCF shadow filtering remains enabled.
3. Placed a **single reusable radial 64×64 CanvasTexture** beneath the house, trees, chicken, tomatoes and tomato crate for light, very local ambient grounding. Contact planes cast no shadows, write no depth, and are offset only 0.006 above supporting surfaces.
4. Calculated tree root positions using actual raised-mound surface heights rather than the flat platform. Anchored the house, tomatoes, chicken feet and crate from their real model dimensions, including beveled edges.
5. Removed vertical root bounce from the chicken; retained only tiny head/wing idle movement so its feet remain stationary.
6. Lowered flower petals onto grass and stopped dozens of tiny decorative clumps from casting distracting shadow shapes.
7. Added a small decorative tomato crate that is physically grounded; it never affects ingredient inventory.

## Technical parameters (initial; subject to live visual review)

| Parameter | Before | After |
|---|---|---|
| Shadow map | 512×512 | 1024×1024 |
| Shadow-camera horizontal bounds | ±9 | ±6.2 |
| Key light position | (-5, 10, 8) | (-3.6, 11.5, 5.1) |
| normalBias | 0.025 | 0.006 |
| bias | −0.00015 | −0.00005 |
| Light fill intensity | 2.0 | 1.6 |
| Shadow filter | PCFSoft | PCFSoft |
| Contact shading | Absent | Shared radial alpha texture (64×64) |

## Required visual and mobile verification before signoff

- Capture **actual WebGL**, not illustration/mockup screenshots, for whole farm overview, tomato close-up, chicken feet, farmhouse base, and side three-quarter view. Preserve before/after if available.
- Verify shadows remain subtle under light changes; tune alpha and normalBias if acne or halos appear.
- Test on physical iPhone Safari at 320, 375, 390, 430px and an actual target iPhone to ensure 30fps is attainable; do not equate a successful CI build with a real-device pass.
- Confirm tomato raycasting, smooth focus/return controls, English/Chinese switching, WebGL fallback, and no fake inventory changes.

**Limitation:** Automated source/invariant and browser fallback tests cannot prove live GPU contact quality. The live Three.js module is loaded from a remote CDN, which the isolated test environment may not be able to reach. A hosted WebGL screenshot and physical iPhone review remain necessary.
