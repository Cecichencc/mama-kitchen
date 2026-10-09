# Kitchen Garden — Shared Family Pantry: Onboarding v1

**Status:** GitHub development only; no active real household backend or synced inventory.
**Scope:** Step 2 — English/Chinese email sign-in, create/join household and owner invitation UX.
**Parent:** [Shared Family Pantry Foundation](./SHARED_FAMILY_PANTRY_FOUNDATION.md)
**App:** `/phase0/index.html` (existing 3D farm remains unchanged).

## What is implemented

In **Pantry → Family Pantry**, the existing local-only status remains visible. **Explore family sharing setup** opens an accessible, mobile-first review sheet.

1. **Sign in:** Enter an email, request a six-digit code, type it, verify, view the signed-in user's households.
2. **Create:** Signed-in owner can choose a household name. A server RPC adds the household and the owner membership atomically.
3. **Join:** Another signed-in user can submit a private, single-use 48-character invitation code (expires after 48 hours).
4. **Invite:** A signed-in member with the *owner* role can generate and privately copy an invitation code, which is shown only in the active dialog session. Invitations are not placed in URLs.
5. **Review:** After creating or joining, the UI explicitly says grocery inventory **is not yet synced** and remains on the original device.

Forms, validation, explanatory text, error states, review controls, buttons and focus management work in English and Simplified Chinese. The design reuses the app's cream surfaces, green controls, rounded corners and 44px-minimum touch targets. No extra bottom-navigation tab or permanent overlay appears on the 3D farm.

### Current default mode — safely disabled

The new `public/phase0/family-config.js` sets `enabled:false`, an empty backend URL and empty public key. On the prototype, the user can **open the dialog and explore the screen layout**, including create/join screens, but sign-in and household network actions remain **disabled** with a clear “Preview only” message.

**No email or OTP has been sent; no accounts or households have been created; no real inventory has been uploaded or synced.**

## Auth technical design

- `family-config.js`: explicit feature gate requiring HTTPS URL and a `sb_publishable_` Supabase public key; keys beginning with `sb_secret_` or `service_role` are not accepted.
- `family-auth.js`: Supabase GoTrue REST email-OTP integration for explicit user actions only:
  - `POST /auth/v1/otp` with `{email,create_user:true}`.
  - `POST /auth/v1/verify` with `{email,token,type:"email"}`.
  - `POST /auth/v1/token?grant_type=refresh_token` when needed.
  - `POST /auth/v1/logout` on explicit sign-out.
- Short-lived access and refresh tokens are **memory-only**, not in localStorage, sessionStorage, cookies or URLs. Reloading the page requires signing in again; this is a deliberate first-beta trade-off for lower persistence risk.
- Requests use the public Supabase key only; never put service-role keys or passwords into the browser. Error display is generic and does not surface raw provider responses or account existence.
- `family-onboarding.js` instantiates an authenticated `shared-pantry-gateway.js` **only after the feature gate is enabled**. The UI calls only `listHouseholds`, `listMembers`, `createHousehold`, `createInvite` and `joinInvite`.
- No `readBatches`, `addBatch`, `correctBatch`, local-stock migration or `createSharedPantrySession` is called from onboarding.

**OTP template requirement:** The Supabase email template must include `{{ .Token }}` to send an entry code, not just `{{ .ConfirmationURL }}` (a magic link). Verified per [Supabase passwordless email documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless) and [email template documentation](https://supabase.com/docs/guides/auth/auth-email-templates).

**Provider configuration still needed:** Verified sender SMTP, allowed email domain and appropriate CAPTCHA/rate limits, authentication email template, project URL and publishable key. These are not created by this PR.

## Security and privacy acceptance

1. All real household and invitation actions require an authenticated user token. Backend RLS/RPC, not the UI, enforces membership and ownership.
2. A 48-hex invitation code is shared privately and never placed in the URL, log or localStorage. It can only be used once, expires in 48 hours and cannot add a third member.
3. No clinical profile, food diary, nutritional or personal measurements are uploaded.
4. The current local Pantry `kitchen-garden.phase1.v1` is entirely independent of authentication and unaffected by opening, closing, signing in, signing out, creating or joining a household.
5. Network failure, invalid token and expired invitation do not imply success or change stock. Tokens are not printed to the user.
6. The app does not automatically read cloud batches after onboarding. That remains the separately reviewed **Device Sync** milestone.
7. Do not confuse the existing automatic Vercel preview with a release to main or production.

## Test plan

- Automated: disabled config, untrusted URL/key rejection, malformed email/OTP, code-resend cooldown, sign-in/verify GoTrue API shapes, JWT injection into membership gateway, refresh-token concurrency, logout and generic error mapping.
- Automated UI: bilingual copy; no stock methods in onboarding; accessible dialog labels, focus-trap and Escape controls; disabled state interaction in a fake DOM.
- Integration before enabling: real Supabase test project, configured `{{ .Token }}` template, two distinct test email accounts, signed-in owner, joiner and unrelated intruder.
- Security before enabling: check RLS isolation under both accounts, invitation expiry/reuse/third person limit, non-owner invite rejection, login abuse protections and handling of network failures.
- Visual before release: 320/375/390/430px iPhone Safari; on-screen keyboard/scroll, OTP autofill, long Chinese text and code wrapping.
- No production or public rollout without explicit owner approval.

## Next development step

**Step 3 — Controlled two-device test with real auth + cloud-authoritative reads**, after a user-approved isolated Supabase test project and independent backend security review. Then implement real Pantry writes with stale-version conflict UI and a separate batch-by-batch **explicit import consent** flow. Do not automatically upload local stock, use localStorage as shared truth or silently merge inventory from two phones.
