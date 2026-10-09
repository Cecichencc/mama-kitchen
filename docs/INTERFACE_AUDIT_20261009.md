# Kitchen Garden — Interface Audit (2026-10-09)

**Scope:** Today's Kitchen preview, recipe-first UI, basket and farm navigation. This is a source and automated-check audit, **not** a completed screenshot or physical-device review.

## Confirmed issue
The Phase 0 smoke test still expected `cookSheet`, `completeSheet`, `actualUsedLines` and `organicAck`. These were deliberately removed from the UI. CI failed in the smoke test and skipped the build step; Vercel separately reported the preview as READY. The smoke test now checks the actual recipe-first screens and selection-only implementation.

## UI review checklist for browser/device pass
- 320, 375, 390, 430px: verify no horizontal scrolling, truncated Chinese strings or overlapping bottom navigation.
- Today's Kitchen: all three meal cards visible, title, recipe art, time, honest ingredient status, independent Another Idea, View Recipe.
- Recipes with unknown pantry ingredients must say **check at home**, not **all available**.
- Pantry: add and correct stock, confirm it changes recommendations but viewing/swapping never deducts groceries.
- Farm: pan/pinch/tap, empty 3D plot +, no persistent quantity labels or redundant resource controls.
- Basket: +/- adjusts recipe selection only; physical stock unchanged.
- Accessibility: 44px tap targets, focus handling in recipe detail, keyboard and non-WebGL fallback.
- Visual: consistent flat SVG artwork, cream cards, garden-green CTA, no blank/incorrect recipe art.
- Real iPhone Safari is a release gate.

## UX recommendations (not yet implemented)
1. Consider collapsing the lower **More recipe ideas** catalogue beneath the three daily cards to reduce vertical density.
2. Disable or explain Another Idea when only one feasible recipe exists, instead of cycling to the same dish.
3. Consider moving infrequent Pantry fields into progressive disclosure.
4. Improve recipe-detail dialog focus trapping and focus restoration.
5. Revisit the small recipe catalogue and untracked ingredients before presenting the planner as a complete balanced three-meal solution.

## Status
Code changes limited to updating the stale smoke test. No UI redesign, no production merge. Await CI and actual browser screenshots before signing off.
