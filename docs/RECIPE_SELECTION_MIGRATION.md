# Recipe-selection basket — Phase 1.5 migration

**Status:** Implemented on development branch, pending CI/browser review.

The recipe basket now uses `recipe-selection.js`, a device-local **non-reserving** list of batch IDs and quantities. Selecting or viewing ingredients never changes physical stock, never blocks Pantry corrections and never starts a 30-minute expiry.

## Data migration
- Old `kitchen-garden.phase1.v1` physical stock remains authoritative and unchanged.
- On first load, any old basket lines are copied into `kitchen-garden.recipe-selection.v1` (if no new selection exists) and the legacy reservation lines are cleared.
- Selection quantities are validated against recorded on-hand stock and clamped after manual stock corrections.
- The existing legacy domain functions remain in source for historical compatibility and old tests, but the active UI no longer calls reservation or cooking functions.

## Acceptance
- Add 6 tomatoes and 8 eggs; select 2 and 3 for recipes; physical and available stock remain 6/8.
- Change selection quantity and clear basket; physical stock remains unchanged.
- Correct tomatoes to 0 in Pantry while selected; correction succeeds and selections reconcile to zero.
- Farm empty plot depends on actual available stock, not recipe selections.
- Reopen app and verify local selection persistence and old basket migration.
- Check English/Chinese, WebGL and fallback, iPhone Safari, and full automated tests.

**Limitations:** Device-local only. The legacy cooked-session records remain historical; no new cooking confirmation UI. Shared household sync and expanded inventory types remain future work.
