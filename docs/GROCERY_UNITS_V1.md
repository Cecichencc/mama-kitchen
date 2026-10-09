# Kitchen Garden — Grocery Unit System v1

**Development branch only. Do not publish to v0 or production.**

## Scope
Inventory quantities remain integers in each ingredient's **base unit**, preserving exact stock corrections and movement history. New items: dry rice (g), chicken (g), fish (g), cooking oil (ml), bok choy (bunch). Previous piece-counted items remain unchanged.

| Base unit | Input options | Notes |
| --- | --- | --- |
| piece | piece | whole items only |
| g | g, kg | 1 kg = 1000 g |
| ml | ml, L | 1 L = 1000 ml |
| bunch | bunch | no assumed weight |
| pack | pack | available helper for future explicitly packaged products; not assigned automatically |

The form selects valid units per ingredient and converts to integer base amounts before saving. Manual stock corrections edit base quantities. Organic sourcing, storage, use-by dates and batch history remain.

**Important limitations:** No automatic bunch/pack-to-gram conversion. Existing recipe quantities are not all quantified; the meal planner must continue to treat rice, fish, chicken, bok choy and oil as *unverified*, not automatically available. The 3D farm still only has tomato and egg interactions. This is not a nutrition calculation.

## QA
- Add 1.5 kg dry rice → 1500 g, correct to 1200 g, reload.
- Add 0.75 L oil → 750 ml.
- Fractional piece and incompatible units rejected.
- Existing tomato/egg batches load unchanged.
- Check Pantry dropdown and labels in English/Chinese at 320–430px.
- Run all existing CI tests and verify the 3D farm remains unchanged.
