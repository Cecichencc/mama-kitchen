# Shared Family Pantry — Isolated Supabase Test Harness (Step 3)

**Status:** Code prepared and mocked locally; **real Supabase testing is blocked until a test project is connected and three temporary test accounts are available**. There is no live household sync or automatic migration in this step.

## Why this matters

Family Onboarding v1 can display sign-in/create/join screens but uses a disabled backend setting. Static checks for RLS and a single-user mock do not establish that Mum and Daughter can safely edit the same live Pantry.

This step adds an **opt-in real-backend integration runner** that can test two authenticated household members, an unrelated account, and competing stock corrections in an isolated Supabase test project. It does **not** automatically apply the SQL migration, register accounts, sign anyone in, enable production, upload local grocery data, or deploy a website.

## What is included

| File | Purpose |
| --- | --- |
| `scripts/shared-pantry-e2e-core.mjs` | Reusable contract checks for membership, invitations, idempotent grocery additions, RLS read isolation and two-user concurrency |
| `scripts/shared-pantry-e2e.mjs` | Strictly gated Node CLI; requires an explicit project ref, publishable key and 3 distinct test JWTs |
| `tests/shared-pantry-e2e.test.mjs` | Mocks a two-user remote service; exercises the contract and proves broken isolation is rejected, without live credentials |
| `public/phase0/shared-pantry-gateway.js` | Adds RLS-scoped `listEvents(householdId)` read to compare server stock events to actual quantity deltas |
| `package.json` | Adds optional `npm run test:shared-pantry:e2e`; never runs it in the regular CI job |

### Remote contract acceptance

1. Test owner creates a **synthetic** `KG TEST ONLY` household; only owner can see its membership.
2. Outsider cannot see that household's stock or issue its invitation.
3. Owner creates a one-time private, 48-hour invitation. Wrong code is refused. Member uses the code once. Reuse by outsider fails. The household cannot grow beyond two people; member cannot issue invitations.
4. Owner creates a **synthetic batch of 6 organic tomatoes**. Both members see it; outsider does not.
5. Repeating the exact add request with the same UUID creates no additional batch or event. Reusing the request UUID with different quantity fails.
6. Two members simultaneously correct version-1 stock to 4 and 5. Exactly one update succeeds; the other receives `STALE_VERSION`. The final row is version 2; quantity is either 4 or 5, never an accidental overwrite.
7. Audit history contains exactly one add and one correction, with correct old/new values and delta. Outsider cannot read household stock.

The runner emits short pass/fail statuses only; it does not log user JWTs, invitation codes, publishable keys, email addresses or server payloads.

## Running safely — connection required

A suitable **Supabase** integration is available to connect in ChatGPT. Connect it and select or create an **isolated test project**, never the production project. Once connected, the backend migration must be reviewed and applied **to that test project only**. Use **three disposable test accounts**, and obtain their temporary authenticated user access tokens through the approved test-auth procedure. Never use personal account tokens or the service-role/secret key in a browser, public chat, or GitHub commit.

Required environment variables (names, **not values**, can be committed):
```text
KG_TEST_PROJECT_REF                 # exact Supabase test project reference
KG_TEST_SUPABASE_URL                # https://<that-ref>.supabase.co/
KG_TEST_PUBLISHABLE_KEY             # sb_publishable_... PUBLIC key only
KG_TEST_OWNER_JWT                   # authenticated TEST account #1
KG_TEST_MEMBER_JWT                  # authenticated TEST account #2
KG_TEST_OUTSIDER_JWT                # authenticated TEST account #3
KG_RUN_REMOTE_TESTS                 # mode selection
```

**Never check in a .env file containing tokens or publishable keys.** Supply them through a trusted local credential manager or encrypted CI secrets, with log redaction and an isolated runner; tokens should be short-lived. The CLI refuses to run if required settings are missing, if the URL is not exactly `https://<ref>.supabase.co/`, if any JWT is malformed/expired, does not contain `role=authenticated`, is long-lived (over 24 hours), or if the three account subjects are not distinct.

- **Read-only preflight:** set `KG_RUN_REMOTE_TESTS=READ_ONLY_PREFLIGHT`, then run `npm run test:shared-pantry:e2e`. This contacts the test backend to list each test account's own households and **creates or modifies no data**.
- **Explicit mutation test:** set `KG_RUN_REMOTE_TESTS=I_CONFIRM_ISOLATED_TEST_PROJECT` and run the same command. This **creates** a synthetic household, invitation, batch and event history in the test project. Test objects are not auto-deleted, so security and audit trails can be inspected before manual cleanup.

The script does not verify the project is non-production merely because the ref matches the URL; a human must confirm that the selected project really is isolated. Therefore **do not run the mutation mode without explicit approval for that specific test project**.

## Current development results versus pending real tests

| Check | Current gate |
| --- | --- |
| Node mock contract / injected RLS failure detection | GitHub Actions test |
| CLI refusal without credentials | GitHub Actions test |
| Normal Vite build and 3D farm assets | GitHub Actions build |
| Real anonymous and unrelated-user RLS isolation | **Requires a live test Supabase project** |
| Real expired/reused invite / 3rd member denial | **Requires live test Supabase project** |
| Real simultaneous 2-account database writes | **Requires live test Supabase project** |
| iPhone Safari / full sign-in email UI | **Requires later live test environment** |
| Sharing actual family groceries | **Not part of this step; must be separately approved** |

## Known security / UX follow-ups

Before any live household access:
- Independently review and execute the migration against a throwaway test project and inspect Supabase SQL/RLS logs. Static tests cannot prove Supabase policy correctness.
- Configure Supabase's email code template to use `{{ .Token }}`, verify sender and auth rate limits.
- Verify table/column access, no service-role key exposure, invitation abuse protections, and confidential code treatment on iPhone.
- Add an owner action to remove members/revoke outstanding invitations and an explicit conflict-retry UX.
- Build cloud-authoritative Pantry reads/writes as a separately opted-in feature.
- Explicitly review existing local batches **one by one** before any proposed upload. No silent import.

## Development / deployment boundary

This is an independent **draft GitHub PR**, with normal GitHub Actions checks only. It intentionally does not execute any external database writes in CI, does not manually trigger Vercel, does not merge to `main`, and does not enable cloud mode in `family-config.js`. Automatic Vercel previews, if any, are still distinct from production.
