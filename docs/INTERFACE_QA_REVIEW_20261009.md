# Kitchen Garden — Interface QA Review (2026-10-09)

## Verified from source and CI
- Vercel preview for the three-meal branch reported READY.
- GitHub workflow run 37882704434 failed in `node --test tests/*.mjs`, specifically because the old smoke test expected `cookSheet`. The recipe-first HTML deliberately removed `cookSheet`, `completeSheet`, `actualUsedLines` and `organicAck`.
- Updated the smoke test to check the current recipe-first UI and explicitly reject the obsolete cooking forms.
- Browser screenshot audit is **not yet complete**. Vercel READY is not evidence that the UI is visually correct.

## UI audit checklist for mobile review
1. **Farm:** no permanent stock labels or extra controls; tomato/egg and empty plots easy to tap; pinch/pan don't trigger selection.
2. **Basket:** simple +/-; no reservation or cooking language; selected quantities never alter physical stock.
3. **Today's Kitchen:** three meal cards fit 375/390px, Chinese labels wrap cleanly, no overflow; independent Another Idea and View Recipe actions.
4. **Recipe detail:** same flat SVG artwork as cards; ingredient availability and untracked-ingredient warnings readable; no Start Cooking.
5. **Pantry:** manual corrections and organic sourcing clear; empty plots restock the right ingredient.
6. **Accessibility:** focus, Escape, reduced motion, 44px hit targets, WebGL fallback.
7. **Functional:** automated domain tests and build; no browser console exceptions.

## Potential issues to inspect next
- Small curated catalogue means meal swaps may repeat or fail to offer an alternative.
- Untracked ingredients are not verified, so three suggested dishes may not all be cookable.
- Old dormant cooking functions remain in `game-ui.js` but are no longer reachable from UI. Consider removing them in a separate cleanup after test coverage.
- Real iPhone Safari interaction, screenshot comparison and performance are still unverified.

## Release gate
Do not merge or promote to production until CI passes and actual mobile screenshots/interaction checks are reviewed.
