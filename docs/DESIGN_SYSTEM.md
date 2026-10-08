# Kitchen Garden — Design System Index

**Version:** 1.0 · 2026-10-08  
**Approved visual direction:** Soft Pastel Toy World (mint sky, sage island, blush farmhouse, white hen, simple soil-resting tomatoes, cream UI).  
**Scope of this update:** **Markdown documentation only.** The playable farm, styling code, inventory and deployments remain unchanged.  
**Baseline reviewed:** `feature/kitchen-garden-grounded-shadows-20261008` (`6caa52c`).

## Design documentation

| File | Purpose | Use when… |
| --- | --- | --- |
| [DESIGN_STYLES.md](./DESIGN_STYLES.md) | Visual principles, current CSS and 3D colour roles, typography, layout, lighting, grounding, motion, accessibility and responsive QA | Creating/refining visual style, tokens, shadows or camera |
| [REUSABLE_DESIGN_ELEMENTS.md](./REUSABLE_DESIGN_ELEMENTS.md) | Existing 3D assets, dimensions, model/collider contracts, UI patterns and future component boundaries | Reusing a tomato, tree, hen, farmhouse, farm HUD or planning new ingredients |
| [PHASE0_PASTEL_REDESIGN.md](./PHASE0_PASTEL_REDESIGN.md) | Original pastel redesign implementation checkpoint | Checking why Phase 0 changed visually |
| [PHASE0_SHADOW_GROUNDING.md](./PHASE0_SHADOW_GROUNDING.md) | Ground-surface maths, contact-shadow and light configuration decisions | Fixing floating shadows without introducing regressions |

## Product and engineering sources

| Source | Authority |
| --- | --- |
| [KITCHEN_GARDEN_PRD.md](./specs/KITCHEN_GARDEN_PRD.md) | Product goals, household users, five farm areas, accepted workflows |
| [KITCHEN_GARDEN_GAME_LOGIC.md](./specs/KITCHEN_GARDEN_GAME_LOGIC.md) | Authoritative stock, reservation, cooking, consumption and two-person rules |
| [KITCHEN_GARDEN_3D_BUILD_PLAN.md](./specs/KITCHEN_GARDEN_3D_BUILD_PLAN.md) | Phases, tech constraints and exit gates |
| `public/phase0/world.js` | **Actual** model/material implementation and 3D scene geometry |
| `public/phase0/grounding.js` | **Actual** surface and model grounding calculations |
| `public/phase0/scene.js` | **Actual** light, camera, renderer, pointer selection and state transitions |
| `public/phase0/styles.css` | **Actual** DOM/CSS tokens and screen styling |
| `public/phase0/i18n.js` | **Actual** English and Simplified Chinese copy |

When documentation differs from code, **do not silently assume the documented proposal has been implemented**. Resolve the discrepancy explicitly, then update both if and when a code change is approved. For inventory, the game-logic specification remains the non-negotiable rule set.

## How to use with Codex

1. Read this index, the PRD, game logic and current feature-branch source.
2. Read **Design Styles** for the accepted visual language; read **Reusable Design Elements** before creating or modifying assets/UI.
3. Preserve the currently working 3D tomato selection, focus/return, English-first with Chinese switch, mobile fallback and grounded shadows.
4. Distinguish **implemented**, **proposed** and **future** elements. In particular, existing local 3D builder functions are **not yet exports**.
5. Never replace live 3D models with reference image sprites, fake stock data, or a static screenshot.
6. For any implementation change, run tests, review mobile screenshots and compare front/side/top WebGL renders against approved references.
7. Keep new development on a branch/draft PR; do not publish production without approval.

## Known gaps (explicitly deferred)

- CSS `--grass` / `--barn` reference values are not identical to the live Three.js grass/house palette; keep the approved current scene and address cross-medium token unification in a separate implementation PR.
- Some values are still hardcoded in CSS and local Three.js material factories; the current documentation describes them rather than claiming full token refactoring.
- `world.js` has locally reusable procedural builders, but no exported 3D asset library yet.
- Only tomato inspection works; basket, recipes, pantry and real stock logic are later phases.
- Full visual-fidelity and measured FPS acceptance still need actual WebGL and physical iPhone validation.

## Maintenance checklist

When updating the design system, include: affected assets/UI components, source files and new tokens, current vs proposed status, English/Chinese copy changes, world-unit anchors and touch colliders, shadow/performance implications, and screenshot / accessibility acceptance. Document a change only after confirming its code status.
