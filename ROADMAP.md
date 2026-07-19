# Add-is → Production Roadmap

This roadmap breaks the "make it Opay-grade" goal into sequential phases. We complete
one phase at a time, in order, across sessions. Each phase ends with working, tested
code merged in — not a plan or a stub. Checkboxes are updated as work lands.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0 — Audit & Baseline (this session)
- [x] Full repo inventory (backend, admin-web, mobile, infra)
- [x] `AUDIT.md` — file-by-file findings, severity-ranked
- [x] `SECURITY_REPORT.md` — vulnerability list (OWASP-mapped)
- [ ] `ARCHITECTURE_REVIEW.md`
- [ ] `PERFORMANCE_REPORT.md`
- [ ] `UI_UX_REVIEW.md`
- [ ] `TEST_COVERAGE_REPORT.md` (currently: 0% — no test files exist)
- [ ] `PRODUCTION_CHECKLIST.md`
- [ ] `FINAL_REPORT.md` (written last, once phases below are actually done)

## Phase 1 — Stop the Bleeding: Critical Security & Money-Safety Fixes
Highest-severity issues that make the app unsafe to run with real money, fixed first.
- [x] Remove/rebuild `POST /wallet/fund` "manual" credit path (currently lets any
      authenticated user credit their own wallet with an arbitrary amount — no
      gateway verification). Real funding must only ever happen via verified
      provider webhook. **Done:** endpoint now returns `410 Gone` pointing callers
      at `/api/wallet/funding/initialize` + `/verify`, which was already the
      correct verified flow.
- [x] Close the race condition in the *real* funding path: `verifyWalletFunding`
      and `handleMonnifyWebhook` used to do `user.walletBalance += amount; save()`,
      which can double-credit if the webhook and a client `/verify` call land at
      the same time, or if Monnify retries the webhook. **Done:** both now
      atomically claim the transaction (`findOneAndUpdate` with a `status: {$ne:
      'completed'}` guard) before crediting, and credit via atomic `$inc` instead
      of read-modify-write.
- [x] Wrap remaining balance-mutating operations elsewhere in the codebase
      (transfers, VTU purchases, refunds) in the same atomic-claim pattern.
      **Done, and found more than expected:**
      - A **second, fully independent Monnify funding implementation** was
        live in `paymentController.js` (`/api/payment/*`), duplicating
        `walletFundingController.js` (`/api/wallet/funding/*`) — both had the
        same race, both are now patched. Consolidating them into one is now
        tracked as a Phase 3 architecture item.
      - `subscribeTV` had a genuine **double-deduction bug** (the debit block
        was accidentally duplicated) — every successful TV subscription was
        charging the customer twice, not just racily.
      - All 7 VTU purchase functions (`payElectricity`, `subscribeTV`,
        `buyAirtime`, `buyData`, `buyEducation`, `buyInsurance`,
        `buyOtherService`) had a TOCTOU race: balance checked, then VTPass
        called, then balance debited — two concurrent requests could both
        pass the check and both get fulfilled by VTPass before either debit
        landed (real overdraft). Rewrote all 7 to atomically reserve funds
        (conditional `$inc`) *before* calling VTPass, and refund atomically on
        failure. Shared logic extracted to `backend/utils/walletLedger.js`
        instead of being duplicated 7 times.
      - Same race fixed in the admin manual wallet-adjustment endpoint and the
        admin transaction-refund endpoint; both now also record which admin
        performed the action (audit trail).
      - Full multi-document Mongo transactions aren't needed yet — everything
        above only mutates one `User` document per atomic op. True
        multi-document transactions become necessary in Phase 3+ for real
        P2P transfers (debit sender + credit recipient as one unit).
- [x] Add idempotency keys to every money-moving endpoint and webhook handler.
      **Done:** built a reusable `Idempotency-Key` header middleware
      (`backend/middleware/idempotency.js` + `backend/models/IdempotencyKey.js`,
      24h TTL). First request with a given key runs normally and its response
      is cached; a retry with the same key while the original is still running
      gets `409`; a retry after completion replays the original response with
      no reprocessing. Wired onto all 7 VTU purchase endpoints, wallet-funding
      `/initialize`, and payment `/initialize`. Webhooks already have their own
      idempotency via the atomic transaction-claim pattern from the item above.
      **Follow-up tracked:** the mobile client needs to actually send the
      header (currently a no-op if it's absent — non-breaking, but not yet
      protective until the app is updated).
- [x] Redact sensitive data from logs. **Done:** added
      `backend/utils/redact.js` (`redactEmail`, `redactAccountNumber`,
      `debugLog`) and swept `authRoutes.js` (the worst offender — full emails
      and full bank account numbers were logged on nearly every login/
      register/profile-fetch request) plus the email leak in
      `paymentController.js`'s webhook success log. `walletFundingController.js`
      and `serviceController.js` were checked too — their existing logs only
      print references/amounts/status, not PII, so nothing there needed
      changing.
- [x] Enforce CSP in production. **Done:** replaced Helmet's generic default
      CSP with an explicit policy in `server.js` (self-only script/style/
      connect/img/font sources, `object-src 'none'`, `frame-ancestors 'none'`),
      verified against `admin-web`'s actual source (same-origin `/api` calls,
      no external CDN/font dependencies) so nothing legitimate breaks.
- [x] Dependency audit across all three `package.json` files. **Done:**
      - Backend: 1 high-severity vuln (`nodemailer` <=9.0.0, multiple SMTP/CRLF
        injection CVEs). Upgraded to 9.0.3 — clean, 0 vulnerabilities now.
      - admin-web: 0 CVEs, but **the project could not `npm install` at all**
        without `--legacy-peer-deps` — `react-beautiful-dnd` (abandoned since
        2022) doesn't support React 19. This would break a from-scratch CI/
        Docker build. Replaced it with its maintained fork `@hello-pangea/dnd`
        (drop-in API, same `DragDropContext`/`Droppable`/`Draggable` names) in
        `BannerManagement.jsx` — clean install now, 0 vulnerabilities.
      - Mobile (frontend): found `.npmrc` pointing at an **unofficial third-
        party registry mirror** (`registry.npmmirror.com`) with
        `strict-ssl=false` — a real supply-chain risk (no TLS verification on
        package downloads, trusting an unofficial mirror) for a fintech
        codebase. Repointed to the official `registry.npmjs.org` with SSL
        verification on, and rewrote `yarn.lock`'s 968 `resolved` mirror URLs
        to the official registry (integrity hashes untouched, so this doesn't
        weaken verification — it strengthens it, since the mirror could no
        longer silently serve different bytes under the same hash-checked
        install). **Not fully completed:** this sandbox has no `yarn` binary
        and correctly blocks the old mirror host, so a full `yarn audit` CVE
        scan of the mobile app's ~968-package tree wasn't run. Tracked as a
        follow-up to run in a real dev environment with yarn installed.
- [x] Secrets audit. **Done:**
      - No `.env` committed, no hardcoded secrets found in source (swept with
        a regex for key/secret/password/token literals — clean).
        `.gitignore` correctly excludes `.env` and variants.
      - Found a real gap: `validateEnv.js` only hard-required `MONGO_URI` and
        `JWT_SECRET` — Monnify credentials weren't validated at all, so a
        deployment missing them would boot successfully and only fail (or
        misbehave) the first time a real transaction hit Monnify. Added
        `MONNIFY_API_KEY`, `MONNIFY_SECRET_KEY`, `MONNIFY_CONTRACT_CODE` to
        required vars; VTPass/email vars to optional (with a warning).
      - Added a minimum-length check on `JWT_SECRET` (must be ≥32 chars) —
        the app now refuses to start with a weak/placeholder secret.
      - Rewrote `.env.example` to match `validateEnv.js` reality and added a
        documented secret-rotation policy at the bottom of the file.

## Phase 2 — Authentication & Session Overhaul
- [x] Refresh-token rotation. **Done:** `backend/models/Session.js` +
      `backend/utils/authSession.js`. Opaque refresh tokens (not JWTs),
      stored only as a SHA-256 hash, one Mongo document per token in a
      "family" (`familyId`) that traces the chain of rotations from a single
      login. `POST /auth/refresh` rotates on every use and detects reuse of
      an already-rotated token (a strong signal of theft) by revoking the
      entire family and logging a security event. `POST /auth/login`,
      `/register`'s email-verify auto-login, and `/biometric-login` all now
      issue a session pair via the same helper instead of each hand-rolling
      a 7-day JWT.
      **Deliberate interim tradeoff:** access tokens are 24h, not the
      target 15m — see `backend/utils/authSession.js` for why (the mobile
      app has ~57 screens calling axios directly with no refresh wiring yet;
      shipping 15m tokens before those are migrated would log users out
      constantly). Built `frontend/utils/apiClient.ts` (centralized axios
      instance, auto-attaches the access token, refreshes and retries once
      on a 401 `TOKEN_EXPIRED`) and wired login + biometric-login to it, but
      **migrating the other ~57 call sites to apiClient.ts is not done** —
      tracked as the next concrete follow-up before dropping the TTL to 15m.
- [x] Session/device model. **Done:** `GET /auth/sessions` (list active
      sessions with device label / IP / timestamps, flags which one is
      current), `DELETE /auth/sessions/:id` (revoke one device),
      `POST /auth/logout` (revoke current session), `POST /auth/logout-all`
      (revoke every session **and** bump `tokenVersion` so any access token
      still held elsewhere stops working within its remaining lifetime, not
      just when its refresh token is next used).
- [x] `tokenVersion` wired up. **Done:** it was already being *checked* in
      `verifyToken.js` but nothing ever set it on the token payload or
      incremented it — dead code. Now embedded in every issued access token
      and bumped on logout-all and password reset (password reset also now
      revokes every session outright, not just the tokenVersion bump).
- [x] Real(er) biometric auth — device-scoped, hashed, rotating. **Done, with
      an honest caveat.** Replaced the single global `biometricToken` shared
      across every device on an account with `biometricDevices: [{deviceId,
      tokenHash, label, ...}]` — each device gets its own credential, stored
      only as a SHA-256 hash (never raw), individually revocable
      (`DELETE /auth/biometric-devices/:deviceId`), and **rotated on every
      successful login** (a captured/replayed credential works at most
      once). Mobile side: `useBiometric.ts` now generates and persists a
      stable per-install `deviceId`, sends it on enable/login, stores the
      credential via `expo-secure-store` with `requireAuthentication: true`
      (OS-level biometric gate on the keystore entry itself, not just an
      app-logic convention), and `disableBiometric()` now revokes
      server-side too (it used to only clear local storage, leaving the
      credential still technically valid).
      **Caveat:** this is *not* true public-key challenge-response biometric
      auth (client keypair, server verifies a signature) — that's the gold
      standard, but it needs a native asymmetric-crypto capability this
      project doesn't have available (`expo-crypto` only exposes hashing/
      randomness, not signing; adding one means a new native module, which
      isn't something to bolt on unverified). What's shipped is a real,
      meaningful upgrade over the prior design (per-device, hashed,
      rotating, individually revocable, OS-keystore-gated) but the biometric
      secret is still a bearer credential rather than a signed challenge.
      True challenge-response signing is left as a explicitly-flagged future
      enhancement, not silently declared "done."
- [x] Transaction PIN hardening. **Found already mostly implemented**
      (lockout after 3 attempts, 15-minute cooldown) — the gap was the same
      read-modify-write race as the wallet-balance issues from Phase 1
      (concurrent guesses could under-count `failedAttempts` and bypass the
      threshold). Fixed with an atomic `$inc`, same pattern as before.
- [ ] Email verification & password reset review (OTP expiry, reuse
      prevention, timing-safe comparison) — not yet done this session,
      carrying forward.
- [ ] **New, found this session:** no "change password while logged in"
      endpoint exists at all — only the forgot-password OTP flow. Missing
      feature, not a vulnerability; tracked here since it's auth-adjacent.

## Phase 3 — Wallet Ledger & Reconciliation Core
- [ ] Proper double-entry ledger (ledger entries, not just a `walletBalance`
      integer mutated in place)
- [ ] Transaction state machine (pending → processing → completed/failed/reversed)
- [ ] Statements, receipts, export (CSV/PDF)
- [ ] Scheduled transfers, refunds
- [ ] Reconciliation job comparing ledger vs provider records

## Phase 4 — Virtual Accounts (multi-provider)
- [ ] Formalize provider interface; Monnify implementation hardened (webhook
      signature verification, retries, idempotency)
- [ ] Add Paystack Dedicated Virtual Accounts
- [ ] Add Safe Haven
- [ ] Account lifecycle management (provisioning, deallocation, migration)

## Phase 5 — Payment Engine
- [ ] P2P transfers, QR payments, merchant payments
- [ ] Card payments (tokenized, PCI-aware)
- [ ] Bank transfer payouts
- [ ] Retries, refunds, settlement, webhook validation across all payment types

## Phase 6 — Admin & Merchant Tooling
- [ ] KYC approval workflow (already partially present — audit & complete)
- [ ] Fraud detection rules/flags
- [ ] Audit logs, reporting, transaction monitoring dashboards

## Phase 7 — Background Services
- [ ] Redis caching layer
- [ ] Job queue (notifications, SMS, email, VTU sync, reconciliation)
- [ ] Health checks, monitoring/alerting

## Phase 8 — Mobile & Admin UX Pass
- [ ] Onboarding, dashboard, skeleton loaders, dark mode, accessibility pass
- [ ] Consistent design system across screens

## Phase 9 — Testing
- [ ] Backend unit + integration tests (target meaningful coverage, not just %)
- [ ] Mobile component/e2e tests
- [ ] Load/performance tests on money-moving endpoints

## Phase 10 — CI/CD & Release
- [ ] GitHub Actions: lint, typecheck, test, security scan, build (backend, admin,
      Android), Docker build, coverage report
- [ ] Deployment readiness checks, release artifact publishing

---

## Status
**Phase 1 complete. Phase 2 nearly complete** — one item carried forward
(email verification/password-reset OTP review) plus one important follow-up
this session surfaced: **migrate the mobile app's ~57 direct-`axios` call
sites to `frontend/utils/apiClient.ts`**, which is the blocker for dropping
the access-token TTL from its current 24h interim value down to the target
15m. Until that migration lands, the 24h TTL should stay — do not shorten it
without doing the migration first, or the app will start logging users out
mid-session on any unmigrated screen.
Also worth knowing: `AUDIT.md` and `SECURITY_REPORT.md` reflect Phase 0/1
findings; a fresh pass incorporating Phase 2's changes is worth doing before
Phase 3 wraps, but isn't blocking.
Next: finish the email verification/password-reset review, then the
apiClient.ts migration, then Phase 3 (wallet ledger & reconciliation core).
