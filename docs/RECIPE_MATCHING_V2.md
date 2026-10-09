# Kitchen Garden — Recipe Matching v2

**Status:** Development-only. No v0 or production promotion.

## Changes
- Shared `recipe-matching.js` checks recorded, non-expired physical batches and compares **base-unit** quantities.
- Curated recipes now specify explicit starter quantities for Chicken Mushroom Rice (250 g chicken, 4 mushrooms, 150 g dry rice), Garlic Bok Choy (1 bunch bok choy, 1 garlic bulb), and Pumpkin Soup (1 whole pumpkin). These are **prototype assumptions**, not verified household portion prescriptions; recipe quantities require culinary review.
- Unquantified ingredients (null), unsupported items (water, salt, salmon), and optional condiments are labelled **Verify** rather than silently assumed available.
- Insufficient tracked stock is labelled **Insufficient**, separately from Verify.
- Today's Kitchen and Recipe Ideas use the same matcher. Daily planning allocates only sufficient tracked amounts within the plan, without deducting real stock.
- Expired stock is excluded from feasibility checks.

## Known limitations
- No gram-to-bunch, cooked-to-dry, pack-to-gram, or fish-to-salmon substitutions.
- Some recipes remain provisional because water/salt/condiments are not tracked. 'Ready' means only that all explicitly quantified, tracked ingredients are sufficient.
- Still a device-local inventory, not two-phone synchronisation.
- No medical nutrition or calorie targets inferred from height and weight.

## QA
- Add 500 g rice, 300 g chicken and 5 mushrooms: Chicken Mushroom Rice tracked requirements pass.
- Remove mushrooms: report insufficient.
- Add pumpkin 1: soup still requests water verification.
- Expired eggs do not count.
- Check 3-meal uniqueness, no stock deductions, bilingual labels and real iPhone Safari.
