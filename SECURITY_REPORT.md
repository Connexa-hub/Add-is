# SECURITY_REPORT.md — Updated after Phase 1

OWASP Top 10 (API/Web) mapping of findings. Re-issued each phase as items are
closed. Phase 0 baseline is preserved below; Phase 1 closed items 1, 2, 5, 6,
7, and 8, and turned up several issues the Phase 0 pass hadn't caught yet
(marked "found in Phase 1").

| # | OWASP Category | Finding | Severity | Status |
|---|---|---|---|---|
| 1 | A04 Insecure Design / A08 Data Integrity Failures | `POST /wallet/fund` credited wallet with no gateway verification | Critical | **Closed** — endpoint removed (410) |
| 2 | A08 Data Integrity Failures | Read-modify-write races on balance mutations across funding, VTU purchases, admin adjustments, and refunds | Critical | **Closed** — atomic reserve/claim/$inc pattern applied everywhere balances are touched |
| 2b | A08 Data Integrity Failures | *(found in Phase 1)* Second, fully independent Monnify funding implementation live in `paymentController.js`, duplicating `walletFundingController.js`, with the same race | Critical | **Closed** (race fixed in both); **consolidation into one implementation still open** — tracked as Phase 3 architecture item |
| 2c | A08 Data Integrity Failures | *(found in Phase 1)* `subscribeTV` had a genuine double-deduction bug — not a race, a live overcharge on every successful TV subscription | Critical | **Closed** |
| 3 | A07 Identification & Auth Failures | No refresh tokens, no session/device revocation, `tokenVersion` unused | Critical | Phase 2 — pending |
| 4 | A07 Identification & Auth Failures | "Biometric login" is a static bearer token, not device-bound biometric auth | Critical | Phase 2 — pending |
| 5 | A09 Security Logging Failures | PII (email, account numbers) logged in plaintext via `console.log` | High | **Closed** — redaction utility added, worst offenders (authRoutes.js, a webhook success log) swept |
| 6 | A04 Insecure Design | No idempotency keys on money-moving endpoints/webhooks | High | **Closed** — `Idempotency-Key` header middleware added to all VTU purchases + funding/payment initialize; webhooks already covered by the atomic-claim fix from #2. Mobile client sending the header is a follow-up. |
| 7 | A05 Security Misconfiguration | CSP relies on Helmet defaults in prod, not an explicit policy | High | **Closed** — explicit self-only CSP now in `server.js` |
| 8 | A06 Vulnerable/Outdated Components | Dependency audit not yet run | Medium | **Closed for backend & admin-web**, partial for mobile — see Dependency Audit section below |
| 8b | A06 Vulnerable/Outdated Components | *(found in Phase 1)* `admin-web` couldn't `npm install` cleanly at all — `react-beautiful-dnd` (abandoned 2022) doesn't support React 19 | High | **Closed** — swapped to maintained fork `@hello-pangea/dnd` |
| 8c | A08 Software/Data Integrity Failures | *(found in Phase 1)* Mobile app's `.npmrc` pointed at an unofficial registry mirror with `strict-ssl=false` — no TLS verification on package downloads, unofficial source | High | **Closed** — repointed to official registry, SSL verification on |
| 8d | A05 Security Misconfiguration | *(found in Phase 1)* `validateEnv.js` didn't require Monnify credentials or check `JWT_SECRET` strength — a misconfigured deploy would boot and fail/misbehave on the first real transaction instead of failing fast at startup | Medium | **Closed** — Monnify vars now required, `JWT_SECRET` minimum length enforced |
| 9 | A09 Security Logging Failures | No structured audit trail for admin actions | Medium | **Partially closed** — admin wallet adjustment and admin refund now log via `logSecurityEvent` with admin ID attribution; other admin mutations (KYC approval, banner edits, etc.) not yet audited — Phase 6 |
| 10 | — | No automated security scanning in CI (none exists yet) | Medium | Phase 10 — pending |

## Dependency audit detail
- **Backend**: `nodemailer` <=9.0.0 had a high-severity advisory cluster
  (SMTP/CRLF header injection, TLS cert validation issues in OAuth2 flow,
  file-access bypass in `jsonTransport`). Upgraded to 9.0.3 — the API surface
  actually used (`createTransport`/`sendMail`) is unaffected by the breaking
  changes. `npm audit`: 0 vulnerabilities after the fix.
- **admin-web**: 0 CVEs found, but the dependency tree didn't resolve at all
  without `--legacy-peer-deps` (see 8b above) — fixed. `npm audit`: 0
  vulnerabilities after the fix, and a from-scratch `npm install` now
  succeeds with no flags.
- **Mobile (frontend)**: registry/SSL misconfiguration fixed (see 8c above).
  A full `yarn audit` CVE scan of the ~968-package tree was **not completed**
  in this sandbox — no `yarn` binary available, and the sandbox correctly
  blocks the old unofficial mirror host (which was actually confirmation the
  restriction was doing its job). **Follow-up:** run `yarn audit` in a real
  dev environment with the corrected `.npmrc`/`yarn.lock` and report results
  here.

## Notes on what's already correct
- Passwords hashed with bcrypt (cost factor 10) — acceptable, could move to 12
  as a hardening item but not urgent.
- Rate limiting present on auth routes (`express-rate-limit`), account lockout
  middleware tracks failed attempts.
- Input validation via `express-validator` (`middleware/validation.js`) is wired
  into register/login/wallet routes — needs extending to every mutating route,
  not rebuilding from scratch.
- NoSQL injection mitigated via `express-mongo-sanitize`.
- `trust proxy` correctly set for reverse-proxy deployments (needed for
  accurate rate-limit/IP logging).
- No hardcoded secrets found in source; `.env` correctly gitignored.

## Next
Phase 1 is closed. Phase 2 (auth/session overhaul — items #3 and #4 above)
is next: refresh-token rotation, session/device management, real device-bound
biometric authentication, PIN hardening, and wiring the existing-but-unused
`tokenVersion` field into an actual revocation path. See `ROADMAP.md`.
