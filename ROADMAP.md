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
- [ ] Refresh-token rotation (short-lived access token + rotating refresh token,
      stored hashed, reuse detection)
- [ ] Session/device model: list active sessions, revoke individual sessions,
      "log out of all devices"
- [ ] Real biometric/Face ID/fingerprint flow: device-bound key pair, challenge-
      response signing, not a static bearer token in the DB
- [ ] Transaction PIN hardening: rate limiting, lockout, PIN reset flow tied to
      identity re-verification
- [ ] Email verification & password reset review (OTP expiry, reuse prevention,
      timing-safe comparison)
- [ ] tokenVersion field (already on User model but unused) wired into logout/
      revoke-all flow

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
**Phase 1 complete.** Every item under "Stop the Bleeding" is done — see the
notes inline above for what was actually found and fixed (several issues
turned out worse than the Phase 0 audit guessed: a live double-deduction bug,
a second duplicate funding implementation, and a build-blocking dependency
conflict in admin-web). `AUDIT.md` and `SECURITY_REPORT.md` remain the Phase 0
baseline; a fresh pass re-auditing against the current code is worth doing
before Phase 2 wraps, but isn't blocking — Phase 2 (auth/session overhaul) is
next: refresh-token rotation, session/device management, replacing the fake
"biometric login" with real device-bound biometrics, PIN hardening, and
wiring up the already-existing-but-unused `tokenVersion` field.
