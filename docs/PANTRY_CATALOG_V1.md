# Kitchen Garden — Pantry Catalogue v1 (development only)

## Scope
Incrementally expand the **manual Pantry** from tomato and egg to ten piece-counted grocery types: tomato, egg, carrot, potato, onion, garlic bulb, mushroom, pumpkin, apple and orange. Keep the original 3D farm limited to its existing tomato and egg resources.

## Changes
- Extend `domain.js` ingredient registry without changing the persisted schema, storage key, batch history or accounting rules.
- Generate the Pantry ingredient dropdown from the registry, with English/Chinese labels and correct names in the stock list.
- Reuse existing flat SVG grocery icons; add pumpkin/apple/orange SVGs.
- Preserve batch-level organic source, fridge/freezer/pantry storage, date and manual quantity correction.
- No automatic stock deduction from recipes or baskets.

## Limitations and next step
- **All ten types are counted as whole pieces**; garlic means a bulb, not a clove. This does not yet support weight, grams, packs, bottles or bunches.
- The meal planner still verifies only tomatoes and eggs. New Pantry entries must **not** automatically turn unquantified recipe ingredients into 'available' claims.
- Fish, meat, rice, oil and leafy greens need explicit unit/portion design before enabling inventory tracking.
- Device-local only; no household sync.
- Do not create new 3D zones or alter the existing farm during this phase.

## QA
- Add pumpkin 2 (organic), apple 4 (nonorganic), correct pumpkin to 1; reload and confirm.
- Switch language and confirm labels remain accurate.
- Check icon rendering and source status in Pantry.
- Verify 3D tomato/egg interactions, recipe browsing and no physical stock deduction.
- Run CI and inspect iPhone Safari at 320/375/390/430px before merging.
