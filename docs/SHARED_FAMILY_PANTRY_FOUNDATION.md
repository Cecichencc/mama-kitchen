# Kitchen Garden — Shared Family Pantry Foundation

**Milestone:** Shared Pantry — secure backend and opt-in readiness
**Build status:** GitHub development only; **not live two-phone synchronisation**. **Later update (2026-10-10):** An isolated Supabase test project now exists with foundational SQL migrations applied and rollback-only database-role smoke tests passed; see [SUPABASE_TEST_PROJECT_STATUS.md](./SUPABASE_TEST_PROJECT_STATUS.md). This historical Stage A document predates the test project's creation.
**Do not merge or deploy** until the user authorises a release.
**Source baseline:** [Kitchen Garden PRD](./specs/KITCHEN_GARDEN_PRD.md), [Game Logic](./specs/KITCHEN_GARDEN_GAME_LOGIC.md), [Shopping List v1](./SHOPPING_LIST_V1.md).

## 1. Goal and actual scope

The household is **Mom + Daughter, one shared real Pantry**. Today's implementation saves each device's inventory in `localStorage`. Neither changing a UI label nor copying that browser data would make it safe for simultaneous edits.

This milestone establishes the **security and consistency foundation** before real shared use:

- A Supabase/Postgres **migration file** defining households, members, expiring one-use invites, batches and append-only events.
- Read access restricted to signed-in household members by Postgres **row-level security (RLS)**. No direct table INSERT/UPDATE/DELETE grants to client roles.
- Authenticated RPCs for household creation, owner-issued invites, invitation joining, idempotent batch additions, and version-checked quantity corrections.
- Household-wide database locks around stock-mutating operations. Updates require an expected batch revision so an outdated phone cannot overwrite a newer edit.
- A browser-side `shared-pantry-gateway.js` with HTTP auth-token injection, safe input validation, and error classification.
- A `shared-pantry-session.js` that reads snapshots and enforces **no writes while disconnected/offline** and **no optimistic stock updates**.
- An honest **local-only Family Pantry status** in Pantry and an interactive, non-uploading preview of current local batches. English/Chinese and same cream/green UI.
- Unit tests and SQL-policy static assertions.

**Important: Shared sync is NOT connected to a real backend in this milestone.** No Supabase project URL, public anon key, sign-in implementation, or production migration has been provided or configured. Two devices still cannot share inventory. All existing groceries remain in the original localStorage under `kitchen-garden.phase1.v1` and are **not uploaded**.

## 2. Security and data contracts

`supabase/migrations/20261010000000_shared_household_pantry.sql` creates:

| Table | Role | Browser permission |
| --- | --- | --- |
| `kg_households` | Household ID, name, timezone | Member-only SELECT |
| `kg_members` | User identity and owner/member role | Member-only SELECT |
| `kg_invites` | SHA-256 digest of single-use invitation, 48-hour expiry | No direct SELECT or write |
| `kg_batches` | Real stock, unit, organic source, storage, use-by and row version | Member-only SELECT |
| `kg_events` | Immutable quantity delta, old/new, actor, request UUID | Member-only SELECT |

The cloud database is authoritative **once sync is explicitly activated**. Each `kg_add_batch` or `kg_correct_batch` is an atomic server-side transaction. The event/audit record is committed in the same transaction. Reusing the same request UUID with different arguments is rejected rather than silently applying another change.

Quantity model: integers in canonical base units (`piece`, `g`, `ml`, `bunch`). Organic status is explicitly `organic`/`nonorganic`/`unknown`; never infer it. The backend only accepts the 15 supported ingredient IDs with the unit specified in `domain.js`.

### Simultaneous edits

Example: both phones show 6 tomatoes, stock version 1.
1. Mom corrects it to 4, server updates to version 2.
2. Daughter tries to correct from version 1 to 5; server rejects with `STALE_VERSION`.
3. Daughter must refresh to see 4 and explicitly decide whether to apply another correction. No silent "last writer wins".
4. A retry with the *same request ID and same arguments* cannot create a second event.

There is **no offline write queue**; an offline operation must not be reported as completed or silently replayed with a new request ID. For network errors after a potential commit, fetch the server state before retrying.

### Household membership

- Signed-in owner creates a household.
- Owner issues a random 24-byte/48-hex invitation **shown once**, valid for 48 hours.
- Another signed-in person joins with that code. The beta limits membership to 2 people.
- An invitation is stored as a digest and can only be used once.
- RLS prevents unrelated signed-in users from querying the household's batches.
- A full production rollout also needs owner revocation/removal of a member, invitation abuse/rate limiting, secure auth callback handling and account recovery; **not yet implemented**.

### Scope exclusions

No personal health data, measurements, medical profiles, nutrition prescriptions, location tracking, marketing analytics or household contacts need to be uploaded for inventory sync. No meal history or shopping list sync in this milestone. The real 3D farm continues deriving its crop availability from the selected authoritative inventory; it never creates food.

## 3. Front-end modules

`public/phase0/shared-pantry-gateway.js`:

- Requires a **HTTPS Supabase URL**, public anon key and **signed-in user's JWT** supplied from a separate authentication module (not yet built).
- Exposes `listHouseholds`, `listMembers`, `readBatches`, `createHousehold`, `createInvite`, `joinInvite`, `addBatch` and `correctBatch`.
- Includes client-side input checks but **relies on server RLS/RPC for actual authorisation and concurrency control**.
- Does not log tokens. Never embed `service_role` credentials in client code.

`public/phase0/shared-pantry-session.js`:

- Converts a cloud batch snapshot into the existing `domain.js` read-only inventory shape, preserving ID, organic source, unit and version.
- Offers `previewLocalInventoryTransfer(localState)` without uploading or modifying any local state.
- Requires an **explicit authenticated gateway** and initial fetch before permitting remote commands; afterward, server response + refetch is the truth.
- On offline/error/conflict: never apply a speculative local stock update; show the user an error and require reconnection/refetch.
- No auto-merge of old local batches. An explicit migration workflow will be designed **before any upload**.

`public/phase0/index.html`, `game-ui.js`, `i18n.js`, `styles.css`:

- Pantry has an honest status: **“This device only · Not shared”** / **“仅限这台设备 · 尚未共享”**.
- A **Review groceries before sharing** action shows local batch/ingredient/date counts, not actual credentials or online status.
- The review explicitly states that no food has been uploaded.
- No fake “Sync now” button and no new farm overlay.

## 4. Rollout plan requiring later permission

This GitHub milestone is **Stage A (foundation)**. It is not automatically live.

| Stage | Next activity | Gate |
| --- | --- | --- |
| A — Current | Database migration, gateway, session model, local stock preview | GitHub unit tests + Vite build |
| B — Backend setup | Create or connect a Supabase project, independent review of migration/RLS, configure OTP login and redirect URLs | User authorises backend setup and sharing configuration |
| C — Authentication | Implement passwordless sign-in, invitation create/join, authenticated household selection | Two independent test accounts and tenant-isolation tests |
| D — Device sync | Wire shared snapshot and transactional RPC writes into Pantry. Ensure offline read-only/error handling and conflict-refresh UX | Multi-device add/correct/last-item collision tests |
| E — Opt-in import | Show batch-by-batch local-to-cloud import preview, deduplicate or explicitly choose source, one transactional migration, user confirmation | **Explicit owner confirmation before uploading any local inventory** |
| F — Release | Physical iPhone Safari UX and accessibility review | User explicitly requests publishing |

### Required checks before real two-device use

- [ ] Real Supabase Postgres migration applied to a **test project**, after independent RLS/security review.
- [ ] Email sign-in and secure session management verified; **no service-role key in browser**.
- [ ] Two authenticated test accounts: unrelated users get 403/zero rows.
- [ ] Invites: wrong code, expired code, used code, third user and non-owner creation denied.
- [ ] Concurrent version-1 edits: one succeeds and another receives `STALE_VERSION`.
- [ ] Same request UUID retry: no duplicate batch or event.
- [ ] Server rejects invalid units, negative quantity, bad sourcing and unapproved food IDs.
- [ ] Offline and token expiration: do not claim writes succeeded.
- [ ] Explicit local-stock import consent, with duplicate prevention.
- [ ] Review iPhone Safari, Chinese text overflow, WebGL farm, shopping list, separate accounts and private household access.

## 5. Current validation limits

Node tests can validate request construction, DTO conversion, offline guardrails, conflict handling and SQL code patterns. **They cannot execute or prove Supabase RLS policies or concurrency correctness** without a running Postgres/Supabase project and two real auth accounts. No such live deployment should be claimed.

The current `domain.js` still contains legacy reservation/cooking helpers, even though recipe-selection UI no longer calls them; these should remain separated from shared stock mutations until explicitly designed. Neither shopping-list checkoff nor recipe viewing may deduct household stock.

## 6. Next engineering milestone

**Shared Family Pantry B — Auth + invite UX:** create passwordless sign-in, safe redirect handling, household creation, joining via private invite, and test-project integration. After that, wire *cloud-authoritative* Pantry mutations and plan controlled local inventory migration. Do not imply that a disabled prototype is already synced.
