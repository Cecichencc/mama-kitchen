# Kitchen Garden — 3D Web Game Build Plan

**Version:** 2.0 · Planning only · 2026-10-08  
**Primary platform:** Mobile browser (iPhone Safari first), then Android and desktop  
**Companion design contract:** [`KITCHEN_GARDEN_GAME_LOGIC.md`](./KITCHEN_GARDEN_GAME_LOGIC.md)  
**Deliverable of this planning stage:** architecture and implementation backlog, **not** a running 3D build.

## 1. Why rebuild

The previous M0/M1 proof of concept is an SVG/HTML farm running as a local single-browser demo; it is **not a deployed, navigable 3D scene**. It is inadequate for evaluating the game feel and isn't an ordinary web URL one can reliably open on iPhone. Its tested stock rules are useful, but the presentation technology must change.

**New success condition:** The user opens a working **HTTPS preview URL in Safari**, taps genuinely 3D farm objects, sees harvested ingredients move into a basket, and cooks a real dish with verifiably updated stock.

## 2. Experience and design direction

### 2.1 Use the supplied artwork as aesthetic reference, not code/assets

- Warm orange / amber background, creamy rounded cards, soft green ground, clay-like toys, red barn and small farmer.
- Chunky organic 3D shapes, matte materials, warm directional lighting, soft ambient shadows and simple textures.
- Cohesive, bright and approachable: no shiny chrome, photo-real grass, game clutter or tiny illegible labels.
- Scene should resemble a hand-made miniature **diorama** rather than a dashboard masquerading as a game.
- The earlier UI references do **not** contain usable game geometry. Recreate assets as original 3D meshes/models (procedural first, polished GLB models later).

### 2.2 Recommended visual system

| Part | Approach |
|---|---|
| Camera | Orthographic isometric-ish 3D camera, elevated ~35–50°, limited zoom and pan; no free rotation in v1 |
| World | One main miniature island with paths between five areas; tap an area for camera focus |
| Crops | Rounded chunky tomato, leafy greens, mushrooms, carrots and egg cluster |
| Land | Floating/slightly raised rounded grass island, smooth soil plots, low picket fences |
| Structures | Red barn, coop, pond dock, orchard trees, small grain/pantry house, central cooking hut |
| Animation | Gentle growth pop, crop pluck/squash, item arc to basket, coop idle, subtle water ripple |
| Overlay | Real accessible HTML/CSS HUD: inventory counts, basket, `今日三餐`, bottom sheets |
| Accessibility | Large tap targets and duplicate text controls; readable Chinese type; reduce motion |

### 2.3 Main screen layout on phone

```text
┌────────────────────────────────┐
│ 🌱 厨房小农场         🧺 2   ⚙ │
│ 今天可以收获 6 种食材            │
│                                │
│   ┌── INTERACTIVE 3D FARM ─┐  │
│   │  Orchard     Barn       │  │
│   │  Vegetable   Pond       │  │
│   │     [ Farmer ]          │  │
│   │        Pantry           │  │
│   └─────────────────────────┘  │
│  点击食材收获 · 点击建筑探索       │
│                                │
│ ┌ 收获提示 / quantity sheet ─┐  │
│ │ 🍅 番茄  库存 6  有机       │  │
│ │       [−] 1 [+] [收获]     │  │
│ └────────────────────────────┘  │
│ 农场       今日三餐      库存     │
└────────────────────────────────┘
```

On mobile, the HUD remains small while the farm occupies most of the central screen. A user should never have to pan the entire webpage sideways to see the farm.

### 2.4 Navigation model

- Open directly into the farm: no blocking tutorial or full-screen welcome after first entry.
- Tap a zone/building to smoothly focus the orthographic camera.
- Tap a resource mesh (or attached tap badge) to open `收获` bottom sheet.
- An always-visible `回到全景` control returns to the whole farm.
- `收获篮` is accessible from the top badge and from Today/Meal screen.
- `今日三餐` is a separate lightweight view using orange/cream cards, not part of the 3D render.
- `库存` / `添加食材` are ordinary large, legible forms outside the Canvas.
- Switch between 3D scene and DOM overlays without remounting/resetting the inventory.

## 3. 3D technical architecture

### 3.1 Recommended stack

| Concern | Technology | Reason |
|---|---|---|
| App | Next.js + React + TypeScript | Routes, shared UI and deploy workflow |
| 3D | Three.js via `@react-three/fiber` | Actual WebGL scene, mesh hit testing, React integration |
| 3D helpers | `@react-three/drei` | GLB model loading, camera/animation helpers as needed |
| UI | Tailwind CSS + small reusable components | Mobile-friendly HUD/dialogs/Chinese UI |
| Local UI state | Lightweight React state or Zustand | Camera, selection, animation, sheets |
| Domain rules | Pure TypeScript functions | Deterministic tests; reusable on server/client |
| Data | Supabase PostgreSQL + Auth + Row Level Security | Shared two-person inventory and sessions |
| Shared inventory operations | Transactional SQL functions / server actions | Prevent overselling stock and duplicate deductions |
| Preview and production | Vercel deployment with HTTPS URL | Directly playable in Safari, no local HTML attachment needed |
| Tests | Vitest, Playwright, real-device Safari QA | Domain invariants + e2e gameplay |
| Assets | Blender → glTF binary `.glb` | Original editable low-poly 3D asset pipeline |

Use WebGL rather than WebGPU as the default mobile delivery path. Treat incompatible/failed WebGL contexts as a fallback condition. Put the Canvas in a client-only boundary; don't try to server-render the WebGL canvas.

**Dependency risk:** Unlike the previous dependency-free local prototype, the full stack requires access to a package registry and a deployment environment. Confirm these in the first milestone; do not silently replace true 3D with SVG if installation is blocked.

### 3.2 System boundaries

```text
App shell (React DOM)
├── Farm page
│   ├── 3D Canvas
│   │   ├── World / lighting / camera
│   │   ├── Zones and GLB meshes
│   │   ├── Interactable resource colliders
│   │   └── Cosmetic animations (no DB mutation)
│   └── DOM HUD / zone labels / bottom sheets
├── Today's Kitchen
│   ├── manual meal composer
│   └── three-slot planner / reroll / cooking confirmation
├── Inventory / grocery intake / corrections
└── Household profiles / settings
        ↓
Typed domain commands: AddGroceries, Reserve, Release, ConfirmCooked, ...
        ↓
Server-validated transactions + PostgreSQL ledger
        ↓
Database subscriptions or refetch → derived crop states
```

**Architectural rule:** 3D meshes never directly mutate database rows. Taps dispatch domain commands; only confirmed results update derived crop states.

### 3.3 Suggested repository structure

```text
kitchen-garden/
  AGENTS.md                         # AI coding boundaries, visual/design rules
  README.md
  docs/
    3d-build-plan.md
    game-logic.md
    visual-direction.md
    test-plan.md
  public/
    models/{barn,farmer,tomato,egg,fish,tree,...}.glb
    textures/
    icons/
  src/
    app/
      page.tsx                       # redirect/load farm
      farm/page.tsx
      today/page.tsx
      inventory/page.tsx
      household/page.tsx
    components/
      farm/FarmCanvas.tsx
      farm/FarmWorld.tsx
      farm/OrthographicCamera.tsx
      farm/Harvestable.tsx
      farm/zones/{VegetableZone,BarnZone,FishZone,OrchardZone,GrainsZone}.tsx
      farm/animations/{HarvestEffect,RegrowEffect}.tsx
      hud/{TopBar,BasketButton,ZoneLabel,HarvestSheet}.tsx
      kitchen/{MealCard,RecipeSheet,CookConfirmation}.tsx
    domain/
      inventory.ts
      reservations.ts
      cook.ts
      mealPlanner.ts
      personAllocation.ts
      types.ts
    data/
      starterIngredients.ts
      starterRecipes.ts
    services/
      inventoryRepository.ts
      householdRepository.ts
    locales/
      zh-CN.json
      en.json
    styles/
  supabase/migrations/
  tests/{domain,ui,e2e}/
```

Keep assets and gameplay data decoupled: each `Ingredient` points at a `modelAssetId`, while numeric stock lives in inventory tables.

## 4. Production asset pipeline

**Step A — Functional greybox**

Use `boxGeometry`, rounded procedural crop groups and colored simple meshes to establish five land areas, camera bounds, tap hitboxes, animations, and state transitions. Greybox is a functional test **not** the visual final.

**Step B — Clay-art models**

Build 3D objects with consistent geometry scale/material palette in Blender or similar modeling tools. Export separate GLB assets for barn, chicken, tomato, carrot, spinach, mushroom, apples, fish, coop, tree, fence, soil tile, cooking hut, farmer, basket.

**Step C — Optimisation**

Reuse meshes/materials for repeated plants; instance vegetation/fences; compress and combine textures where appropriate; lazy load zones; use mostly baked/cheap lighting; test real phones before adding effects.

**Do not** use single flattened PNGs of a farm as the play surface while describing them as 3D. Promotional 2D/3D-looking images may inform style, but the interactive farm must contain real geometry.

## 5. Gameplay rules

The authoritative rules are in `KITCHEN_GARDEN_GAME_LOGIC.md`. The implementation must support:

1. `ADD`: Manual intake changes real stock.
2. `HARVEST`: 3D tap holds stock in basket **without deducting** on-hand.
3. `EMPTY / REGROW`: Temporary plot animation; it regrows only when unreserved stock remains.
4. `OUT_OF_STOCK`: Empty plot persists when availability reaches zero; restock prompts.
5. `DECIDE`: Manual ingredient selection or auto-generated recipe(s).
6. `COOK`: Confirm actual amounts; commit atomic stock deduction and meal record.
7. `EAT / LEFTOVERS`: Person-specific actual consumption and leftover tracking without double-deducting raw stock.
8. `CORRECT`: Change incorrect quantities, mark stock used outside game or thrown away, preserving an audit trail.
9. `ORGANIC`: Source tracked per batch; daughter preferred, mother flexible; mixed pot explained honestly.
10. `VARIETY`: Jointly plan 3 distinct daily meals where feasible and favour variety across ~7 days.

## 6. Phased build tasks and review gates

### Phase 0 — Working hosted skeleton and proof of WebGL

**Goal:** Solve “I cannot play it” before investing in elaborate assets.

- [ ] Create new repository (do not overwrite user's portfolio or other games).
- [ ] Establish Next.js/React/Three dependency compatibility, build and CI.
- [ ] Deploy a **very simple real 3D canvas** (orange ground + one rotating/tappable tomato) to a Vercel preview URL.
- [ ] Test the URL in desktop Chrome and actual iPhone Safari; display helpful WebGL fallback.
- [ ] Verify screen/safe-area sizing, taps and no horizontal overflow.

**Exit:** User can open a stable HTTPS preview and successfully tap a 3D tomato on phone.

### Phase 1 — Beautiful playable core island (vertical slice)

**Goal:** Test the feel of harvesting and exact underlying quantities.

- [ ] Build miniature 3D island with one tomato bed, chicken coop, barn, small farmer and basket.
- [ ] Orthographic camera, constrained focus, mesh tapping, enlarged colliders, one-button return to overview.
- [ ] Produce original clay-style models and lighting for these first assets.
- [ ] Add manual stock input for tomatoes and eggs (organic-status choices).
- [ ] Tomato/egg harvest to basket; empty plot; cosmetic regrowth if stock remains.
- [ ] Implement one real recipe (`番茄炒蛋` for two) and `我做好了` actual quantity confirmation.
- [ ] No hidden deductions, batch separation, no negative quantities; save data between visits.
- [ ] Release a hosted playable preview after each complete interaction.

**Exit:** A user can add 6 tomatoes and 8 eggs, harvest 2+3, cook, and observe 4 tomatoes and 5 eggs without a page reset or phantom food.

### Phase 2 — Shared backend and reliability

- [ ] Add Supabase Auth and household membership for mother/daughter.
- [ ] Migrate local proof-of-concept inventory rules to server-side transactional commands.
- [ ] Add multiple stock batches, precise unit conversion, expiry/date handling and immutable stock ledger.
- [ ] Add two-phone shared basket reservations, expirations and conflict messaging.
- [ ] Add quantity correction, used independently, discarded and undo where safe.
- [ ] Test two-device last-item races and repeat-click idempotency.

**Exit:** Both phones show the same accurate stock, and simultaneous harvest/cook does not corrupt it.

### Phase 3 — Complete five-area 3D farm

- [ ] Build vegetable garden, protein barn, fish pond, fruit orchard and grain/pantry as connected 3D areas.
- [ ] Link ingredient catalogue to zone meshes/models and stock-derived states.
- [ ] Add camera-focus transitions and coherent world layout, keeping readable touch labels.
- [ ] Build custom resource animations and gentle idle ambience (with motion controls).
- [ ] Make `库存` forms capable of managing all seeded ingredients.

**Exit:** Each zone contains harvestable real-inventory-driven resources; no virtual multiplication.

### Phase 4 — Today's Kitchen and two-person meals

- [ ] Build three cards for 早餐/午餐/晚餐 consistent with provided visual reference.
- [ ] Add `我想自己选` and `帮我决定` plus partial-auto selection from one ingredient.
- [ ] Seed and review ~30–40 household-friendly dishes with correct 2-person quantities.
- [ ] Add joint daily planning, no double-allocation, no identical same-day recipe, 7-day diversity preference.
- [ ] Add source-specific allocation, organic-preferred warnings, substitutions and recipe reroll.
- [ ] Record cooked/consumed/leftovers separately; allow eating out.
- [ ] Allow editable portion sizes and person-specific dietary settings without automated clinical prescriptions.

**Exit:** Three realistically cookable, different meals can be planned and prepared for mother and daughter, and stock remains correct.

### Phase 5 — Polish, performance and soft launch

- [ ] Tune stylized materials/lighting/animation to approach concept images.
- [ ] Add farmer/chef idle reactions and optional progressive farm unlocks (purely cosmetic).
- [ ] Add PWA manifest/installability and safe caching; plan offline behavior explicitly.
- [ ] Test iPhone Safari, Android Chrome, desktop, slow devices, reduced motion and no-WebGL fallback.
- [ ] Profile performance and optimize model assets.
- [ ] Add privacy/security checks for household and any health settings.
- [ ] Run 7-day family trial; track decisions-to-meal, corrections, missing inventory and enjoyment.

**Exit:** Stable mobile-first web app that the household can use every day.

## 7. Performance/accessibility targets (initial, validate on hardware)

- Tap objects and food-category buttons comfortably at ~44px or larger on touch screens.
- Aim for stable **30 fps or higher** on the intended iPhone; 60 fps where attainable. No frame target should trump stock correctness or usability.
- Aim for a small initial transfer (indicative 3 MB for initial scene assets) and fast time to interactivity, to be adjusted after profiling real devices/network.
- Limit dynamic lights/shadows, avoid expensive full-screen post-processing; instance repeated foliage and preload only near-area assets.
- Cap device pixel ratio on mobile if necessary and render only when scene changes where possible.
- Respect reduced-motion; keyboard and screen-reader users get DOM ingredient controls and complete cooking flows.
- Handle WebGL loss/unavailability with a functional, non-3D inventory/harvest/meal interface.
- Touch movement must not accidentally harvest; confirm via clear hit region and deliberate tap.

## 8. Test plan

| Category | Critical test |
|---|---|
| Browser | Open preview URL in physical iPhone Safari and Android Chrome |
| 3D | Mesh is actually 3D; controlled focus/zoom, correct tap colliders and no stuck camera |
| Visual | Clay models, lighting, palette and proportions sufficiently match reference intent |
| Inventory | Add → reserve → regrow/empty → cook → deduct; counts remain accurate |
| Organic | Distinct sourcing batches; honest handling for shared/mixed dish |
| Race safety | Last ingredient harvested from two devices succeeds at most once |
| Meals | Three distinct meals if feasible; source and quantities correct for both people |
| Corrections | `用完了` / `修正库存` explain and reconcile existing reservations |
| Accessibility | Large labels; reduced-motion; non-3D controls functional |
| Deployment | HTTPS URL works after refresh/redeploy and isn't only a downloadable file |

## 9. Decisions intentionally left for visual exploration

- Exact miniature-farm island geometry and arrangement of the five areas.
- Farmer character design (human, animal or simple chef helper).
- Whether crops fly directly into the basket or use a bouncing pickup animation.
- How zone transitions feel (camera focus only vs optional short animated walk).
- How deep the farm-reward progression should be, without making meal decisions tedious.
- How photo-based grocery import might fit after manual input proves useful.

**Recommendation:** After approving this plan, explore a **3D farm scene storyboard** and **one interactive vertical-slice demo** rather than more isolated static UI screens.

## 10. Recommended very next sprint

Only **Phase 0 + Phase 1** should be authorised initially. The first review should be the working *Safari-playable* miniature farm, not a ZIP file. Do not build all zones or personalised AI meal planning before the baseline tap → reserve → cook → regrow loop works and looks appealing.

---

### References for implementation (not endorsement)

- React Three Fiber Canvas: https://r3f.docs.pmnd.rs/api/canvas
- React Three Fiber Events: https://r3f.docs.pmnd.rs/api/events
- React Three Fiber models: https://r3f.docs.pmnd.rs/tutorials/loading-models
- Three.js WebGLRenderer: https://threejs.org/docs/pages/WebGLRenderer.html
- Next.js client components: https://nextjs.org/docs/app/getting-started/server-and-client-components