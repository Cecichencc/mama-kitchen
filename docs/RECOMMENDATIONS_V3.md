# Kitchen Garden — Recommendation Variety v3

**Development only. No production or v0 deployment.**
**Based on:** [Recipe Matching v2](./RECIPE_MATCHING_V2.md) and [Home-Cooking Library v1](./HOME_RECIPE_LIBRARY_V1.md)

## Problem

Today’s Kitchen had 19 curated recipes but repeatedly selected the same few dishes because preparation time broke ingredient-matching ties. The previous `daily.history` value was never populated, so its supposed repeat-avoidance logic could not work. "Another Idea" could also cycle a list containing only one recorded-feasible recipe and return the same dish.

## Scope implemented

1. **Pantry relevance first.** Compare current, non-expired recorded ingredient batches with each recipe's quantified base-unit requirements. Rank fewer required-but-unverified ingredients above less-supported ideas; give recipes with some quantified requirements priority over those consisting entirely of unverified ingredients. The state remains honest: missing amounts are missing, null/unsupported quantities need checking.
2. **Recently suggested dish rotation.** Keep the final three suggested recipe IDs from each prior day in **device-local storage**, retained for **seven calendar days**. Repeatedly rendering the same day must not create more history entries. Suggestions are **not** cooked-meal records.
3. **Category variety.** When Pantry fit and recent repetition are equal, prefer different recipe categories for the day's three meals (e.g. soup vs stir-fry). Do not use category variety to override a better Pantry match.
4. **Favorites as a tie-breaker.** Already-saved favorite IDs can influence otherwise comparable suggestions. Availability and recent variety come first. No preference settings or extra UI controls added.
5. **Another Idea cycles distinct alternatives.** It can show a lower-match, provisional dish if it is the only alternative. The warning remains visible. A normal recipe-selection action never reserves or deducts stock.
6. **Recipe Ideas and Today's Kitchen use the same ranking module** `public/phase0/recommendation-ranking.js`.
7. **Honest language.** Unquantified condiments or ingredients are “Needs checking” rather than necessarily “Not recorded.” Notes explain recommendations are not a cooking log.

## Deterministic recommendation priority

1. Deprioritise recipes with **zero quantified Pantry requirements** (unknown-only recipes cannot masquerade as verified).
2. Minimise **unmet quantities plus unverified amounts**.
3. Prefer more already-sufficient required ingredients.
4. Break ties by fewer insufficient recorded quantities.
5. Penalise recipes already suggested over the prior 7 days.
6. Prefer a category not yet suggested today.
7. Prefer favourites when otherwise comparably suitable.
8. Prefer shorter preparation time; recipe ID resolves final ties deterministically.

A favourite or novel dish **never outranks a strictly better Pantry fit**. The planner draws from the full ranked list when the user taps Another Idea so a distinct alternate can appear, clearly labelled if provisional.

## Data contract and migration

- Storage key remains `kitchen-garden.daily-ideas.v1`; does not overwrite inventory or selection keys.
- Object: `{date,offsets,suggestions,history}` with `history:[{date,ids:[recipeIds]}]`.
- Sanitize ID/date/offset input on load; older flat string history is ignored because it never represented actual cooked meals.
- On the first opening of a new Singapore calendar day, move **only the last suggestions from the previous date** into 7-day history, clear swap offsets and choose a new plan.
- Local only, no Cloud sync or analytic collection from this feature. If local storage is unavailable, recommendations still work, but history does not persist across sessions.
- No automatic stock deduction, batch reservations, nutrition calculations, meal-completion logging, or claim that a suggested dish was cooked.

## Test gates

- [x] Unit coverage added for ranking precedence, tied favourites, category variety, day rollover/retention, corrupt or legacy storage, alternative recipe cycling and physical-stock immutability.
- [ ] GitHub Actions tests + build must pass.
- [ ] Real iPhone Safari and English/Chinese visual check (especially Another Idea and provisional warnings).
- [ ] Production/v0 deployment requires explicit user approval.

## Follow-up candidate

After household review, add an optional **"I made this"** feedback action (strictly opt-in, never assumed), or use explicit meal likes/dislikes rather than only recent suggestions. Do not implement cooking records or background syncing without request.
