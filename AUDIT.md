# AUDIT.md — Phase 0 Baseline

Scope: `backend/` (Express+Mongoose API + `admin-web/` React dashboard) and
`frontend/` (React Native/Expo app). This is the baseline audit that Phase 1+
work is prioritized against. It will be re-run and expanded as later phases land.

## Stack summary
- **API**: Express 4, MongoDB via Mongoose, JWT auth (`jsonwebtoken`), bcryptjs
- **Admin**: React + Vite SPA, served from `backend/admin-web`, built into the
  backend on `postinstall` in production
- **Mobile**: React Native / Expo, screen-per-file under `frontend/screens`
- **Integrations found**: Monnify (virtual accounts + transfers), VTPass (VTU/
  bills), SendGrid/Nodemailer (email)
- **Integrations claimed in prompt but absent**: Paystack Dedicated Accounts,
  Safe Haven, card payment processor, QR payments, merchant payments
- **No test files anywhere** (`*.test.*`, `*.spec.*` — zero matches)
- **No `.github/workflows`** — no CI/CD of any kind

## Findings (severity-ranked)

### Critical
1. **`POST /wallet/fund` credits real balance with no payment verification.**
   `walletController.fundWallet` takes `amount` and `paymentMethod` straight from
   the request body, creates a `completed` transaction, and adds `amount` to
   `user.walletBalance` — no call to any payment gateway, no webhook, no proof of
   funds. Any authenticated user can mint money into their own wallet. This is a
   direct fraud vector and must be the first thing fixed. *(Phase 1, item 1 —
   in progress.)*
2. **No transactional integrity on balance mutations.** `user.walletBalance +=
   amount; await user.save()` is a read-modify-write with no MongoDB session/
   transaction and no optimistic concurrency control. Two concurrent requests
   (e.g. two debits, or a debit racing a webhook credit) can lose an update.
   At fintech scale this produces silent balance drift.
3. **No refresh tokens / session management.** Login issues a single JWT valid
   for 7 days (`jwt.sign(..., { expiresIn: '7d' })`). There is no refresh token,
   no server-side session record, no way to list or revoke individual device
   sessions, and no "log out of all devices" endpoint — despite `tokenVersion`
   already existing on the `User` schema and being *checked* in `verifyToken`,
   nothing in the auth routes ever increments it, so it's currently dead code
   that can never actually invalidate a token.
4. **"Biometric login" is not biometric.** `enable-biometric` generates a random
   32-byte hex string, stores it in the DB, and returns it to the client.
   `biometric-login` just looks up a user by that token. This is a bearer secret
   with no device binding, no OS Keychain/Keystore attestation, and no
   challenge-response — functionally a second permanent password that, if
   intercepted once, grants login forever until manually rotated. Real Face
   ID/fingerprint support requires local biometric unlock of a device-held key
   pair, with only the public key ever touching the server.

### High
5. **Sensitive data logged in plaintext.** Auth and wallet routes log user
   emails, Monnify account numbers/references, and internal state via
   `console.log` on essentially every request path. In production this leaks
   PII into log aggregators with no redaction.
6. **No idempotency keys.** Registration, wallet funding, and (from a scan of
   `paymentController`/`walletFundingController`) provider callbacks don't
   enforce idempotency keys, so retried requests/webhooks can double-process.
7. **Single virtual-account provider, no abstraction.** Monnify is called
   directly from `authRoutes.js`, `walletFundingController.js`, and scripts —
   there's no provider interface, so adding Paystack/Safe Haven today would mean
   duplicating this logic rather than implementing a common contract.
8. **CSP disabled outside production, and unverified in production.**
   `helmet({ contentSecurityPolicy: isProduction ? undefined : false })` turns
   CSP fully off in dev (acceptable) but relies on Helmet's default policy in
   prod with no explicit directives reviewed for this app's actual asset/API
   origins.

### Medium
9. **No automated tests** — zero unit, integration, or e2e coverage. Every
   change to money-handling code today is unverified by anything but manual QA.
10. **No CI/CD** — no lint, typecheck, test, or security-scan gate before code
    ships. `backend/package.json`'s `test` script is a placeholder
    (`echo "Error: no test specified" && exit 1`).
11. **One-off maintenance scripts in `backend/scripts/`** (`fixGhostAccount.js`,
    `findMonnifyReference.js`, `createMissingMonnifyAccounts.js`,
    `syncExistingMonnifyAccounts.js`) suggest the Monnify integration has needed
    repeated manual data repair in the past — a symptom of reconciliation gaps
    rather than a cause; Phase 3/4 should make these scripts unnecessary.

### Low
12. Duplicate-looking admin pages (`Banners.jsx` vs `BannerManagement.jsx`,
    `KYC.jsx` vs `KYCManagement.jsx`, `VTUProducts.jsx` vs
    `VTUProductManagement.jsx`) need a pass to confirm which are live vs dead
    code and remove the unused ones.

## What's genuinely solid already
- `express-mongo-sanitize`, `helmet`, `express-rate-limit`, and
  `express-validator` are present and wired into `server.js` — the security
  *scaffolding* exists, it's the money-flow logic on top of it that's unsafe.
- Account lockout (`middleware/accountLockout.js`) and structured security
  event logging (`middleware/securityLogger.js`) already exist and are used
  consistently in the auth routes.
- KYC document/selfie/review flow has real screens and a backing controller,
  not just stubs.
- Email verification and password reset use OTP + expiry correctly (though see
  Phase 2 item on timing-safe comparison).

## Next
See `ROADMAP.md` for the phase plan and `SECURITY_REPORT.md` for the OWASP-
mapped detail on findings above. Phase 1 work begins with finding #1.
