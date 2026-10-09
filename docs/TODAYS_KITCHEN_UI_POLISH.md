# Kitchen Garden — Interface Polish v1.1

**Scope:** UI only, no farm or inventory changes. Development branch; no production merge.

## Changes
- Today's Kitchen displays Breakfast/Lunch/Dinner as the first and primary content.
- The full Recipe Ideas catalogue is collapsed by default and opened with an explicit accessible button.
- Chinese and English labels for expand/collapse.
- Three meal cards keep their individual Another Idea and View Recipe controls.
- Mobile CSS protects 320–390px layouts against narrow cards and long availability warnings.
- Focus-visible styling for meal actions and catalogue toggle.

## Acceptance
- Opening Today's Meals first shows only the three daily suggestions and an Explore More Recipes control.
- Expanding reveals the existing recipe catalogue; collapsing hides it again.
- Swapping one meal and viewing details continue to work without changing stock.
- Review 320, 375, 390, 430px and desktop; confirm actual Safari screenshot.
- GitHub CI must pass. Vercel READY alone does not constitute visual validation.

**Not yet verified:** Physical iPhone screenshot audit, touch accessibility, final Chinese wrapping. Existing three-meal matching remains provisional for untracked groceries.
