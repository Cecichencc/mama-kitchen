# Kitchen Garden — Phase 1 First Playable Vertical Slice

**Implemented:** 2026-10-08 on `feature/kitchen-garden-harvest-cook-20261008`.  
**Status:** Draft development review; **never merged/deployed to production without approval**.  
**Design reference:** [PHASE1_INTERACTION_DESIGN.md](./PHASE1_INTERACTION_DESIGN.md).

## What this phase changes

Builds one complete Farm → Harvest → Basket → Recipe → Cooking loop on top of the existing, grounded Soft Pastel Toy World Three.js scene. The scope remains intentionally small: **Tomatoes, eggs and 番茄炒蛋**. The existing root Vite/React Mama Kitchen app is preserved and the farm remains at `/phase0/index.html` while the full application architecture is still under development.

### Working capabilities

- Two real 3D harvestable ingredient resources: existing soil-resting tomatoes and a **new 3D egg nest beside the white hen**.
- 3D mesh hit colliders, camera focus and return-to-overview behaviour.
- Mobile-friendly HTML harvest, basket, recipe, actual-use and completion sheets.
- Manual batch-level grocery entry, separate organic status and optional use-by date.
- Batch-aware reservations. Harvesting alters **available** quantity, not physical **on-hand** quantity.
- Cosmetic empty/regrow animation driven by availability; no stock magically appears.
- Validated, idempotent cooking confirmation, movement audit and two prepared servings; no automatic consumption log.
- Actual physical stock adjustment and explicit "Used up" actions, subject to basket constraints.
- English default with immediate Simplified Chinese switch.
- Fully functional HTML/non-WebGL inventory and cooking route for browsers where 3D cannot load.

### Explicit limitations

1. **Single browser/device only.** Uses localStorage, not Supabase; there is no household account, multi-device locking or synced mother/daughter allocation yet. LocalStorage might be cleared by browser storage settings.
2. **Not a three-meal planner.** Today's Meals shows breakfast/lunch as unplanned and one curated dinner idea. This avoids presenting a prototype as a full meal plan.
3. **Not a clinical meal plan.** Recipe serves two prepared portions; it is just one dish, not full protein/carbohydrate/fibre guidance or individual requirements.
4. **Actual eating/leftovers not yet tracked.** Cooking deducts ingredients and logs prepared food, but no claim is made that anyone ate it.
5. **External Three.js module import remains pinned on jsDelivr for this technical prototype.** Hosted browsers must be able to fetch it for real 3D; if they cannot, the accessible fallback operates.
6. **No photo/receipt scanning, unrestricted AI recipes, fully functional five zones, real growth timers or PWA installability in this milestone.**
7. **Physical iPhone Safari 3D performance, crop hit-testing and visual animation are still a sign-off requirement**, not a condition proved by local code or fallback tests.

## State and persistence contract

`domain.js` is deliberately independent of Three.js, the DOM and storage. Its serializable data schema v1 is:

```json
{
  "schema": 1,
  "sequence": 1,
  "batches": [],
  "basket": { "lines": [], "expiresAt": null },
  "sessions": [],
  "movements": []
}
```

**Never seed fictitious quantities.** A new browser starts at zero. A person must explicitly enter every batch. Batches contain their own sourcing and storage information. Whole-piece quantities are used for tomatoes/eggs. Snapshot is stored in localStorage key `kitchen-garden.phase1.v1`. Unusable/expired inventory is not available to harvest. Holds expire after 30 minutes at the next app interaction/load and do not change on-hand stock.

Inventory commands are immutable: `addGroceries`, `reserve`/`setReservation`/`clearBasket`, `correctStock`, and `confirmCooked`. `confirmCooked` enforces two ingredient minimums and an idempotency key, checks source-status acknowledgement, then deducts exact **actual-used** lines once. **Rendering, 3D animations, localization and UI navigation never directly mutate physical stock.**

## Acceptance scenario

1. In Pantry manually add **6 organic tomatoes** and **8 organic eggs**. Do not interpret these as stock that magically existed before entry.
2. On Farm, tap a 3D tomato (or accessible action). Reserve **2 tomatoes**. On-hand remains **6**, available becomes **4**.
3. Tap the 3D egg nest (or accessible action), reserve **3 eggs**. On-hand remains **8**, available becomes **5**.
4. Open Basket, review and optionally adjust each held line. Recipe detail becomes enabled when at least 2 tomatoes and 3 eggs are held.
5. Select Cook with these → Start cooking → review actual 2 tomatoes/3 eggs → I cooked this.
6. On-hand must now equal **4 tomatoes and 5 eggs**, with a single cooking session and two corresponding audit movements; basket is empty.
7. Duplicate submission with the same idempotency key must **never** deduct again. Cancelling the basket must never deduct physical stock.
8. If all usable stock becomes zero, the farm stays empty until groceries are added, without automatic inventory creation.

## Files and responsibilities

| File | Purpose |
| --- | --- |
| `public/phase0/domain.js` | Pure deterministic data validation, stock, basket and cooking |
| `public/phase0/game-ui.js` | State adapter and localized mobile screen interactions |
| `public/phase0/scene.js` | WebGL camera/raycast and explicit UI integration boundaries |
| `public/phase0/world.js` | 3D tomato and egg resources and cosmetic regrowth |
| `public/phase0/index.html` | Farm, Pantry, Today and modal screens |
| `public/phase0/styles.css` | Approved pastel UI, bottom sheets and responsive layout |
| `public/phase0/i18n.js` | English + Simplified Chinese strings |
| `tests/phase1-domain.test.mjs` | Domain invariants and real-stock acceptance |
| `tests/phase0-smoke.mjs` | Source, architecture, i18n and preserved 3D structure |
| `tests/browser-gameplay-check.py` | Local Chromium fallback end-to-end journey; does not prove WebGL |

## Validation and rollout

Run:

```sh
node --test tests/*.mjs
npm ci
npm run build
```

Build and tests are expected to run in GitHub Actions on the feature branch; full local `npm ci` may be blocked in isolated tooling. Verify the preview URL's `phase0/index.html` route in Safari, confirm the 3D scene is visible, and test tomato and egg tap targets. Check at mobile widths 320/375/390/430 and desktop. Do not merge to main or promote Vercel preview to production until the user reviews the experience.

**Next phases:** server-authoritative household stock, organic assignment by person, genuine meal-variety logic across breakfast/lunch/dinner, prepared leftovers/consumption, fully modelled ingredient zones, and polished PWA delivery.
