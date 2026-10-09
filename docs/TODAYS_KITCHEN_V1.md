# Kitchen Garden — Today's Kitchen (three-meal suggestions)

**Status:** Development implementation; pending CI and iPhone review.

## Behaviour
- Today's Meals now displays Breakfast, Lunch and Dinner recipe ideas for two people, each with SVG artwork, time, ingredient status and View Recipe.
- Each meal has an independent Another Idea control. Suggestions are distinct within the same plan.
- A deterministic planner allocates *tracked* tomato and egg quantities across the three displayed ideas to avoid double-counting.
- Untracked ingredients (rice, chicken, fish, etc.) remain explicitly **needs checking**; no invented pantry quantities or unsupported nutrition guarantees.
- Reading, swapping and favouriting never reserves or deducts physical stock.
- Existing general recipe browser remains below the three daily suggestions.
- English/Chinese content and existing flat SVG art system preserved.
- Day-level swap offsets saved locally. Shared household sync and real consumption remain out of scope.

## Known limits
- Small curated recipe set (now eight recipes), so some meals may have no verified suggestion, and a swap may repeat when only one option is feasible.
- Only tomato and egg are currently tracked. Suggestions with untracked ingredients are *provisional*, not confirmed cookable.
- Not a medically personalised diet plan or nutritional adequacy calculation.
- Daily suggestions don't constitute a reserved stock allocation; they are illustrative simultaneous ideas, not commitments.
- Real device and browser visual validation pending.

## Acceptance
1. With 6 tomatoes and 8 eggs, three distinct meal ideas appear without stock deductions.
2. With 2 tomatoes and 2 eggs, total tracked allocations across displayed ideas do not exceed stock.
3. Empty pantry never claims untracked ingredients are available.
4. Swap lunch without changing breakfast selection preference or physical stock.
5. Check 320/375/390/430px, iPhone Safari, both languages and recipe detail access.
