# Kitchen Garden — Isolated Supabase Test Database Status

**Checked:** 2026-10-10 (Singapore time)
**Environment:** TEST ONLY; not production, not connected to the existing app.
**Organization:** Cecichencc's Org
**Supabase project:** Kitchen Garden Shared Pantry — Test
**Project reference:** `voytokitbphutqgrvutm`
**Dashboard:** https://supabase.com/dashboard/project/voytokitbphutqgrvutm
**Region:** `ap-southeast-1` (Singapore)
**Cost quoted by Supabase on creation:** **0 USD/month** on the organization's Free plan. Any future plan changes or extra consumption require separate review.
**Project status at setup:** `ACTIVE_HEALTHY`.

The project is an isolated test database. No real Mom/Daughter groceries, account emails, medical data, dietary preferences or user sessions have been imported. No production/Vercel deployment has been made.

## Applied migration history

| Supabase migration version | Migration name | Source |
| --- | --- | --- |
| `20261010005440` | `kitchen_garden_shared_pantry_test_foundation` | `supabase/migrations/20261010000000_shared_household_pantry.sql` |
| `20261010005921` | `kitchen_garden_shared_pantry_test_fk_indexes` | `supabase/migrations/20261010010000_shared_pantry_fk_indexes.sql` |

**Both migrations returned `success: true`.** The first migration creates the five private app tables, policies, invite/membership logic and authenticated stock mutation RPCs; the second adds five covering indexes for foreign keys flagged by the Performance Advisor.

Original foundation migration comments about not being applied were correct when authored. It has **now been applied to this isolated test project only**, not to production; retain that history. Future schema changes require new additive migrations rather than silently mutating the applied foundation migration.

## Database state after tests

- `public.kg_households`: **0 rows**, RLS enabled
- `public.kg_members`: **0 rows**, RLS enabled
- `public.kg_invites`: **0 rows**, RLS enabled
- `public.kg_batches`: **0 rows**, RLS enabled
- `public.kg_events`: **0 rows**, RLS enabled
- Disposable `auth.users` identities from this smoke test: **0 rows** remain.

Postgres grants were checked on all tables as `anon` and `authenticated`:

- `anon`: no `SELECT` for any of the five tables and no execution of stock RPCs.
- `authenticated`: `SELECT` only on households, members, batches and audit events, restricted by membership RLS; no direct table `INSERT`, `UPDATE` or `DELETE`.
- `kg_invites`: no browser `SELECT` grant and no SELECT policy. Only validated RPCs may create/consume invitation records.
- Neither browser role has `CREATE` on the `public` schema.
- Five deliberately exposed authenticated RPCs check `auth.uid()`, household membership/ownership and input validation before writing.

## Behavioral smoke test executed

A database-level test was executed within `BEGIN ... ROLLBACK` using three temporary `auth.users` identities and `SET LOCAL ROLE authenticated`. **It completed without SQL errors** and all temporary test records were confirmed absent afterward. The full reproducible test is committed at `supabase/tests/rollback_only_family_security_smoke.sql`.

Checks successfully completed:

1. Owner creates household and becomes owner; only owner can create private invitations.
2. Member cannot see or modify the household before joining.
3. Member joins with one invitation; a used invitation cannot be reused.
4. Unrelated third person cannot see audit records, issue invitations or join an already full two-person family, even with a second unused code.
5. Owner adds 6 organic tomatoes; retrying the same request UUID does not duplicate the batch.
6. Reusing a request UUID with a different quantity fails.
7. Owner changes stock from 6 to 4, advancing version 1 to 2.
8. Member's outdated version-1 correction fails with `STALE_VERSION`; after rechecking version 2, the member changes 4 to 2.
9. Exactly three audit records capture deltas `+6, -2, -2`, old/new quantities and the correct final total.
10. Rollback leaves all five tables empty.

**Scope limit:** Because these tests use database role impersonation, they do NOT establish that Supabase Auth emails, real signed JWT HTTP requests, OTP templates, cross-browser sign-in, simultaneous physical phones, HTTP REST API calls or all security edge cases work. The opt-in remote harness in [SHARED_FAMILY_REMOTE_TEST_PLAN.md](./SHARED_FAMILY_REMOTE_TEST_PLAN.md) remains a separate requirement.

### Supabase Advisor findings

Security Advisor after migration:

- **INFO:** `kg_invites` has RLS enabled and **no read policy** — intentional fail-closed design with **no authenticated table SELECT grant**.
- **WARN (six):** Security-definer functions can be called by signed-in users. Five of these are intentional, membership-checked business RPCs for household/stock transactions; the remaining `kg_is_member` is an exposed helper that may be moved to a private schema. These warnings are **not silently dismissed**; independent security review and reduction of unnecessary exposed privileges remain requirements before release. See [Supabase Advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

Performance Advisor after second migration:

- Missing foreign-key-index warnings resolved.
- Seven informational **unused index** findings remain because the new app tables are empty; do not drop indexes without real query analysis. [Index advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Next work required

1. Configure a dedicated test email sender/template using `{{ .Token }}` to deliver numeric Supabase OTPs; review allowed redirect URLs and auth rate limits.
2. Obtain three independent **test-only** authenticated sessions (owner, member, unrelated visitor), without exposing their JWTs in GitHub files or chats.
3. Run the guarded HTTP integration suite `npm run test:family:remote` and review security findings with the real JWT role. Test invitation replay, stale updates and two genuinely concurrent server requests.
4. Review or move the public SECURITY DEFINER membership helper and harden any remaining exposed RPC permission concerns.
5. Only after verification, explicitly enable a browser **test-only** connection, implement cloud snapshot access, stale-edit UI and explicit opt-in migration.
6. Run physical iPhone Safari and bilingual UX QA; user approval is mandatory for production/v0 publication.

**Current product truth:** Kitchen Garden's Farm, Today's Meals, shopping list and Pantry still read **device-local** data. No code has flipped `FAMILY_BACKEND_CONFIG.enabled` to true, and no real synchronisation is active. The old game remains fully playable independently of the new test database.
