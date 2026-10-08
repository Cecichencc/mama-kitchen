# Kitchen Garden — Recipe-first Phase 1 revision

## User decision
The main purpose is helping Mum decide what to cook, not tracking the cooking process.

## Updated journey
1. Add groceries (quantity, sourcing, location) manually, including by tapping an empty farm resource.
2. Select tomatoes and eggs from the farm. These are recipe-basket selections, **not proof that food was consumed**.
3. Review the basket and open the Tomato & Egg Stir-fry recipe.
4. Read ingredients and steps. There is no Start Cooking, cooking confirmation or completed-meal step.
5. Optionally update physical stock using Pantry corrections or mark a batch Used Up.
6. When physical stock reaches zero, the corresponding farm crop disappears. Tapping its empty area/ingredient shortcut opens the Pantry with that ingredient preselected; entering groceries makes it visible again.

## Scope and safeguards
- Only the existing curated tomato/egg recipe is supported. No invented daily plans.
- The local data domain retains historical cooking-session support for backwards compatibility, but the new interface no longer invokes it.
- Basket selections currently use the existing **30-minute temporary reservation** implementation. This is a transitional technical detail; a future migration should replace it with non-reserving ingredient selections so browsing cannot block stock corrections. Basket expiry currently remains in place.
- No automatic physical-stock deduction when reading recipes.
- Device-local persistence only; no household sync.
- Organic/non-organic sourcing remains explicit.
- Farm rendering, model geometry, camera, language switch and fallback are preserved.
- A future phase can expand the recipe catalogue, add three distinct daily meals and offer optional stock-use shortcuts without adding a mandatory cooking workflow.

## Acceptance checks
- Start with no food: tomato and egg controls display + Add food and open the corresponding Pantry input.
- Add 6 tomatoes and 8 eggs: farm crops appear.
- Select 2 tomatoes and 3 eggs: basket lists the choices, physical on-hand remains 6/8.
- Open recipe: see ingredients and steps, without any cooking-confirmation button.
- Close recipe: physical stock remains unchanged.
- Mark all tomatoes used in Pantry after releasing basket selection: farm shows empty tomato plot; tapping it opens tomato grocery entry.
- Test 320/375/390/430px and real iPhone WebGL before production approval.

## Known limitations
- The basket still uses temporary reservations rather than a fully non-reserving selection model; release basket items before reducing physical stock below held amounts.
- No actual hosted-browser verification has been completed in this documentation update.
