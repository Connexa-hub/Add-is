const mongoose = require('mongoose');

// Backs refresh-token rotation and device/session management.
//
// Rotation + reuse detection design (industry-standard pattern):
//  - Each login creates a new "family" (familyId) — the chain of tokens
//    issued as a user's session gets refreshed over time.
//  - Every successful /auth/refresh call issues a brand new Session document
//    in the same family, and marks the one that was just used `rotated: true`
//    (kept around, not deleted, until it naturally expires via the TTL index).
//  - If a refresh token that's already marked `rotated: true` is presented
//    again, that's a signal the token was stolen and used by someone else
//    after the legitimate client already rotated past it (or vice versa) —
//    the entire family is revoked and a security event is logged.
//  - `revoked: true` (set directly, not via rotation) means the session was
//    intentionally logged out — either this device only, or all devices.
//
// Access tokens are short-lived (15 min) JWTs carrying the user's
// `tokenVersion`; bumping `tokenVersion` (done on "logout all devices" and
// password change) invalidates any access token still in a client's memory
// immediately, without waiting for it to naturally expire.
const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  familyId: { type: String, required: true, index: true },
  refreshTokenHash: { type: String, required: true, unique: true },
  rotated: { type: Boolean, default: false },
  revoked: { type: Boolean, default: false },
  revokedReason: { type: String }, // 'logout' | 'logout_all' | 'reuse_detected' | 'password_changed'
  deviceLabel: { type: String }, // e.g. "iPhone 14 · iOS 17" — best-effort from User-Agent / client-supplied name
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, expires: 0 } // TTL index — Mongo deletes the doc once expiresAt passes
});

SessionSchema.index({ familyId: 1 });

module.exports = mongoose.model('Session', SessionSchema);
