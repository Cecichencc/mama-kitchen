# Kitchen Garden — Smart Shopping List v1

**Status:** GitHub development branch only. No merge to `main`, v0 release, or manual Vercel/production deployment.

## Product intent

Help someone decide what to shop for **after selecting real recipes**, without making assumptions that ingredients not entered in Pantry are necessarily missing. Kitchen Garden remains recipe-first, not a cooking tracker or point-of-sale system.

### Navigation

1. Open **Today's Meals** and select a recipe.
2. In recipe details, choose **Add recipe to Shopping List**.
3. The Shopping List opens as a compact, accessible sheet. The Today’s Kitchen header also has a **Shopping List** entry with a count of selected recipes.
4. Add further recipes to combine requirements; the sheet shows each selected recipe with a remove button.
5. **To buy:** measured shortages only, presented with the base unit (pieces, g, ml, bunches). Quantities from multiple recipes aggregate; the same usable stock is subtracted **once** across all selected recipes.
6. **Check at home:** unquantified or untracked requirements (e.g., water, salt, flour, ginger). These are **not automatically counted as missing or added to purchases**.
7. **Already recorded:** optional collapsed section for ingredients whose recorded usable quantity covers the total requirement.
8. Check items off manually and optionally **Copy list**. Toggling a checkbox has no effect on the Pantry.
9. For a measured shortage, **Add to Pantry** opens the normal Pantry form with the correct ingredient, unit and shortage prefilled. **The user must confirm the physical purchase, source and storage before submitting.** No automatic stock addition happens.

## Data model

- File `public/phase0/shopping-list.js` provides pure shopping calculations.
- UI `public/phase0/shopping-ui.js` uses the existing green/cream visual language, mobile-first bottom sheet, keyboard-accessible dialog and English/Chinese labels.
- Storage key: `kitchen-garden.shopping.v1`, stored locally on the same device. State:
  `{schema:1,recipeIds:[...],checked:{ingredientId:shortageAmount}}`.
- Checked marks apply **only** to that exact calculated shortage amount. If recorded stock changes the shortage amount, the old checkbox cannot be shown as checked.
- Removing a recipe clears checklist marks to prevent ambiguous carryover; clearing the list clears both selected recipes and marks.
- Existing Pantry, harvested-selection basket, favourites and seven-day recommendation keys remain untouched.
- Item quantities are stored in each ingredient's base unit; **do not convert bunch-to-grams, cooked-to-dry rice, or packs to weight**.
- Used/expired batches (by recorded use-by) are excluded using the existing `recordedStock()` function.

## Stock calculation example

For two recipes requiring **2 eggs each** and **3 usable eggs** recorded, list **1 egg** to buy, not 4 eggs. For 250 g dry rice needed and 200 g usable recorded, list 50 g dry rice to buy. If a recipe requires `['oil',null]`, show cooking oil under **Check at home** instead of inventing an amount.

## Core invariants and safety

- Shopping selection/checkoff/copy never calls `addGroceries()`, `correctStock()`, `reserve()` or `confirmCooked()`.
- 'Checked' is a shopping task mark, **not** evidence of cooking or purchase.
- Shopping calculations never mutate real batches or change organic/non-organic sourcing labels.
- **Unknown ingredient quantities are not shopping deficits**. Manual confirmation is always necessary.
- If storage is unavailable, the list remains usable in the current session and gracefully loses persistence on reload.
- Copy to clipboard may fail inside restrictive browsers; show explicit feedback.
- No cross-phone sharing, background reminders, e-commerce, grocery delivery integrations or nutrition analysis in v1.
- Accessible close controls, focus trap, Escape, keyboard-checkbox interactions, min 44px targets, no permanent farm overlay. Mobile bottom sheet and desktop centered sheet.

## Implementation files

- `public/phase0/shopping-list.js`: sanitize/aggregate, checkbox snapshots, totals from non-expired recorded stock.
- `public/phase0/shopping-ui.js`: selected recipe list, shortage/verify/covered sections, copy checklist, handoff callback.
- `public/phase0/recipe-discovery.js`: Shopping List entry and recipe detail action.
- `public/phase0/game-ui.js`: explicit Pantry form prefill; no auto-submit.
- `public/phase0/styles.css`: responsive shopping sheet.
- `tests/shopping-list.test.mjs`, `tests/shopping-list-ui.test.mjs`: regression coverage.

## Acceptance scenarios

- [ ] Select two egg recipes with 3 usable eggs: exactly 1 egg shortage.
- [ ] Reuse the existing 19-recipe catalogue and ensure details still show units and SVG illustrations.
- [ ] Select multiple rice dishes: aggregate gram requirements and subtract recorded dry rice only once.
- [ ] Expired eggs never satisfy a recipe shortage.
- [ ] Oil/flour/water/ginger with unknown quantities are in **Check at home**, not **To buy**.
- [ ] Check a line; correct Pantry stock so the shortage changes; line must become unchecked.
- [ ] Remove a recipe; duplicate requirements and check marks update safely.
- [ ] Tap Add to Pantry: ingredient, base unit and amount prefill, but actual stock remains unchanged until manual submit.
- [ ] Switch English/Chinese and test 320/375/390/430px Safari UI, long names, focus trap and clipboard restrictions.
- [ ] GitHub Actions unit tests and Vite build succeed; review with household before release.

## Future milestone

After validating manual shopping and quantity semantics, implement opt-in two-device household synchronisation with authentication and transactional stock updates. Do not imply a checklist is shared or automatically purchased until then.
