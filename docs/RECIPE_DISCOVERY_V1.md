# Kitchen Garden — Recipe Suggestions v1

**Scope:** Curated bilingual recipe suggestions, detail steps, alternative ideas and local favourites. No mandatory cooking confirmation. No stock deduction when reading recipes.

## Implemented
- Seven starter recipes in `public/phase0/recipes.js`, including the five approved dish concepts where feasible.
- Filters for All, Breakfast, Lunch, Dinner; deterministic ranking by tracked missing ingredients, unknown ingredients and time.
- **Another Idea** cycles through recommendations; recipe detail displays ingredients, steps, time and two-serving context.
- Save/unsave favourites in browser localStorage.
- Ingredient matching checks recorded tomato and egg stock only. Other ingredients are **unknown**, not assumed available.
- Grocery changes trigger recipe reranking.
- Green/cream recipe cards follow the approved visual system.
- No Start Cooking, cooking confirmation or stock deduction in the new recipe UI.

## Image asset limitation
The approved recipe board is a visual reference, not a library of individual production images. This implementation uses category/dish emoji illustrations as **temporary fallbacks** rather than pretending the approved individual WebP assets have been generated or integrated. Replace with stable recipe-ID image URLs once actual separate assets are approved.

## Known gaps
- Household stock is local to the device, not synced.
- Only tomatoes and eggs are tracked. The rest must be checked manually.
- Existing harvest basket still uses temporary reservations; a future domain refactor should make it selection-only.
- Favourite persistence is browser-local.
- Real WebGL/mobile QA, accessibility focus trapping on the recipe detail dialog and deployment verification remain outstanding.

## Acceptance
- Opening Today's Meals shows recipe suggestions and filters.
- Another Idea cycles without touching stock.
- Recipe details show the correct translated ingredients and steps.
- Favourites persist on reload.
- Missing tracked ingredients are labelled; untracked ingredients are never claimed available.
- Pantry changes rerank suggestions.
- No cooking confirmation is required.
