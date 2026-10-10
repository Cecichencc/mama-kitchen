# Kitchen Garden — Shared Family Pantry: Isolated Backend Test Gate

**Historical Stage 3A:** GitHub-only preparation. **Update (2026-10-10):** A separate Singapore Supabase test project has since been created, and its SQL migration and database-role smoke tests have passed. Real HTTP test-user authentication and concurrent browser verification remain pending. See [SUPABASE_TEST_PROJECT_STATUS.md](./SUPABASE_TEST_PROJECT_STATUS.md).

## Current status

The Supabase app is now connected for project discovery, but the account **has no existing Supabase projects** (checked 2026-10-10). No isolated test database is available, so **database permissions, real invitation consumption, and simultaneous edits have NOT been verified against Postgres**. The linked GitHub PR provides a guarded test harness that can run only after the user approves creating or choosing a dedicated test project.

The Kitchen Garden mobile app is still local-only. The `family-config.js` feature gate remains `enabled:false`. No household grocery data has been transferred or shared, and no production/v0 deployment was performed.

## Purpose

Verify the shared-Pantry security contract using three truly separate **test** accounts:

1. **Owner:** Creates the family and invites a member.
2. **Member:** Joins by single-use invitation, reads identical batches and edits shared stock.
3. **Outsider:** Must not see or modify that household's groceries, members, or audit records.

Three accounts are needed to verify both the normal two-person household journey and isolation from unrelated users.

## Deliverables

- `public/phase0/shared-pantry-gateway.js`: member-scoped, read-only `readEvents(householdId)` endpoint for audit verification, on top of existing restricted stock APIs.
- `integration/remote-test-guard.mjs`: mandatory explicit remote-test opt-in, strict project-ref check, valid Supabase HTTPS host, public key, three distinct unexpired **authenticated-role** JWTs issued by the same test project. Tokens never print in errors.
- `integration/shared-family-remote.test.mjs`: real REST/RPC requests using only the three test users' access tokens. The server, not local fake data, enforces RLS and concurrency.
- `tests/remote-e2e-guard.test.mjs`: unit tests ensuring no remote execution without all safety gates and no accidental secret logging.
- `.github/workflows/family-pantry-remote-e2e.yml`: **manual workflow_dispatch only**, requiring GitHub environment `family-e2e`, independent input acknowledgement and environment secrets. It never runs automatically on PRs or pushes.
- `package.json`: `npm run test:family:remote` explicit script, plus normal `npm test`.
- `.gitignore`: exclude dotenv, local secret/token files and generated build artefacts.

## Required independent project approval

Before creating a project, request the user's choice of Supabase **organization**, then obtain the exact project cost and have the user explicitly confirm. A Singapore-region test project (`ap-southeast-1`) is the recommended default for this household, but region and organization require approval. Never reuse a production or personal-data project.

**Do not apply the existing migration until it has been reviewed.** The SQL migration in `supabase/migrations/20261010000000_shared_household_pantry.sql` has not yet been applied anywhere through this workflow.

After project creation, configure passwordless email OTP with a template using `{{ .Token }}` and approved sender/rate limits. Create three **fictional/test** accounts. Sign each in separately and keep their access JWTs in GitHub's protected **environment secrets**, never in repository code, PR comments, ChatGPT text, URLs, or committed `.env` files.

### Environment settings for isolated remote run

| Name | Meaning |
| --- | --- |
| `KG_ENABLE_REMOTE_E2E` | Must equal `I_ACCEPT_ISOLATED_TEST_WRITES` |
| `KG_TEST_SUPABASE_URL` | Exact test project URL: `https://<test-ref>.supabase.co/` |
| `KG_TEST_PROJECT_CONFIRMATION` | Must equal `isolated-test:<test-ref>` (matches URL ref) |
| `KG_TEST_PUBLISHABLE_KEY` | Public `sb_publishable_...` key from **test** project |
| `KG_TEST_OWNER_JWT` | Test owner's short-lived access JWT (never a service-role key) |
| `KG_TEST_MEMBER_JWT` | Separate test member JWT |
| `KG_TEST_OUTSIDER_JWT` | Separate unrelated test-account JWT |

The remote test uses Supabase's authenticated JWTs to exercise ordinary user-access permissions. Local preflight checks token structure, issuer, role, expiry and distinct test-account IDs; **only Supabase validates signatures and RLS at runtime**. JWTs must still have at least five minutes remaining when the test starts.

### Manual execution (after test project exists)

```sh
# Load the variables above into a secure local environment; never echo token values.
npm ci
npm test
npm run test:family:remote
```

For a GitHub-managed run, configure a protected environment called `family-e2e`, with required reviewers and all five test-project credentials/URLs as environment secrets. Trigger **Family Pantry Remote E2E (manual)**, enter the exact test project ref and confirmation string. This dispatch workflow must exist on the default branch before it becomes available in the GitHub Actions UI; do not merge it until specifically approved. No remote E2E runs through normal push/PR CI.

## Real two-phone tests in the script

1. Owner creates new **test-only** household; outsider creates an unrelated household.
2. RLS: outsider sees **zero** target batches, audit entries and household rows; owner cannot view the outsider's household stock.
3. Owner creates two independent 48-hour codes; member joins with one.
4. Used invitation cannot be reused. Third account cannot join through unused code because the two-member limit is enforced.
5. Non-owner cannot issue invitations; owner cannot issue more once household is full.
6. Owner adds six organic tomatoes with a unique request ID. Retrying the exact command does not create duplicate stock/events; changing payload under the same ID is rejected.
7. Member reads six tomatoes, then owner corrects to four (version increment). Member's stale attempt is rejected with `STALE_VERSION`; refreshing and changing to two works.
8. Run truly concurrent owner/member corrections from **the same server version**. Exactly one succeeds and the other fails with a stale-version conflict.
9. Verify audit event count and precise before/after quantities, version numbers, organic-source and unit integrity.
10. No test logs print access tokens or plaintext invitation codes.

**IMPORTANT:** The script intentionally leaves test households, batches and event rows in the isolated database so failures can be investigated. The test project is disposable; arrange controlled test-data cleanup/deletion separately with the user. Never execute this script against an account that contains genuine household or production data.

## Not automatically tested

- Real email OTP delivery and anti-abuse limits (requires provider configuration and test accounts).
- Expired invite after 48 hours without an authorized test-time clock fixture.
- Production-scale database security, edge cases outside the current 15-item catalogue and manual security review.
- Offline replays, device-to-device UX and Safari touch interactions.
- Actual two-device sync into the current 3D Farm or Shopping List.
- Local Pantry migration, deduplication, backups and human-approved import.
- No backend was provisioned, no migration applied and no live tests executed in this GitHub milestone.

## Acceptance before cloud integration

- [ ] User approves Supabase organization, exact cost and isolated project creation.
- [ ] SQL security review and migration on **isolated test project**.
- [ ] Security Advisor results reviewed; RLS and RPC grants verified in Postgres.
- [ ] Three test accounts with OTP configured; project-scoped tokens valid.
- [ ] Remote test passes including concurrent update conflict and audit checks.
- [ ] Confirm partner sees exactly same authoritative stock and third account sees none.
- [ ] Test-key and invitation handling reviewed, abuse/rate limits configured.
- [ ] Physical iPhone Safari and Chinese/English onboarding UX verified.
- [ ] User explicitly approves activating sync and future batch-by-batch local import.
- [ ] User separately approves production/v0 publishing.

### References

- [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase email OTP documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless)
