# Today's Kitchen — Compact Cards v1.2

**Implementation:** Development branch only. No production merge.

## UI
- Breakfast, Lunch and Dinner display compact horizontal cards: reusable SVG food art on the left; dish name, time, source-check status and View Recipe on the right.
- Another Idea is a quiet text action in each meal header.
- Ingredient availability is an inline line, not a large coloured banner.
- The full recipe catalogue remains collapsed by default.
- English and Simplified Chinese labels preserved.

## Provisional recommendations
- If no tracked-feasible recipe exists for a meal, show a **provisional** recipe instead of an empty card.
- Tracked shortfalls are labelled **Not enough recorded**; untracked ingredients are labelled **Not recorded**.
- If both exist, show both distinctly.
- Never call a provisional recipe fully available.
- Provisional meals do **not** allocate imaginary tracked stock. Tracked-feasible suggestions continue to allocate recorded stock across meal slots.
- Suggestions never reserve or deduct real inventory.

## Validation
- Check 320, 375, 390, 430px and desktop for text wrapping, illustration sizes and tap targets.
- Verify empty Pantry shows provisional breakfast rather than blank state.
- Verify organic/source and actual stock remain unchanged.
- Verify the 3D farm, pinch/pan, empty plots and SVG recipe details are unchanged.
- Run CI and test on iPhone Safari before merging.

**Limitations:** This is a curated meal-idea planner, not a fully verified or nutritionally personalised three-meal plan. Untracked groceries still require manual confirmation.
