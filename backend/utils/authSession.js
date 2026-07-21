const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');

// Migration complete (2026-07-20): every authenticated call site in the
// mobile app now goes through frontend/utils/apiClient.ts, which attaches
// the access token automatically and silently refreshes+retries on a 401
// TOKEN_EXPIRED instead of failing. The only remaining raw-axios calls are
// LoginScreen.tsx's own /login and /biometric-login requests, which are
// unauthenticated bootstrap calls that don't need refresh handling. Safe to
// use the target short TTL now — do not raise this again without checking
// whether new screens have been added that bypass apiClient.
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, tokenVersion: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function deviceLabelFromRequest(req, suppliedLabel) {
  if (suppliedLabel && typeof suppliedLabel === 'string') return suppliedLabel.slice(0, 100);
  const ua = req.get ? req.get('user-agent') : req.headers?.['user-agent'];
  if (!ua) return 'Unknown device';
  return ua.slice(0, 100);
}

/**
 * Start a brand new session (login, register, biometric login). Creates a
 * new token family and returns both tokens for the client to store.
 */
async function issueSession(user, req, deviceLabel) {
  const familyId = uuidv4();
  const rawRefreshToken = crypto.randomBytes(48).toString('hex');

  await Session.create({
    userId: user._id,
    familyId,
    refreshTokenHash: hashToken(rawRefreshToken),
    deviceLabel: deviceLabelFromRequest(req, deviceLabel),
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get ? req.get('user-agent') : undefined,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken: rawRefreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL
  };
}

/**
 * Rotate a refresh token: validate it, detect reuse, and issue a new pair
 * in the same family. Returns { ok: true, accessToken, refreshToken } or
 * { ok: false, reason } where reason is 'invalid' or 'reuse_detected'.
 */
async function rotateSession(rawRefreshToken, user, req) {
  const tokenHash = hashToken(rawRefreshToken);
  const session = await Session.findOne({ refreshTokenHash: tokenHash, userId: user._id });

  if (!session || session.revoked) {
    return { ok: false, reason: 'invalid' };
  }

  if (session.rotated) {
    // This exact refresh token was already used once before. Someone is
    // presenting a stale token — treat the whole family as compromised.
    await Session.updateMany(
      { familyId: session.familyId },
      { $set: { revoked: true, revokedReason: 'reuse_detected' } }
    );
    return { ok: false, reason: 'reuse_detected' };
  }

  if (session.expiresAt < new Date()) {
    return { ok: false, reason: 'invalid' };
  }

  const rawNewRefreshToken = crypto.randomBytes(48).toString('hex');

  await Session.updateOne(
    { _id: session._id },
    { $set: { rotated: true, lastUsedAt: new Date() } }
  );

  await Session.create({
    userId: user._id,
    familyId: session.familyId,
    refreshTokenHash: hashToken(rawNewRefreshToken),
    deviceLabel: session.deviceLabel,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get ? req.get('user-agent') : undefined,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  });

  return {
    ok: true,
    accessToken: signAccessToken(user),
    refreshToken: rawNewRefreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL
  };
}

/** Revoke a single session by its raw refresh token (logout this device). */
async function revokeSessionByToken(rawRefreshToken, userId) {
  await Session.updateOne(
    { refreshTokenHash: hashToken(rawRefreshToken), userId },
    { $set: { revoked: true, revokedReason: 'logout' } }
  );
}

/** Revoke every session for a user (logout all devices). */
async function revokeAllSessions(userId, reason = 'logout_all') {
  await Session.updateMany(
    { userId, revoked: false },
    { $set: { revoked: true, revokedReason: reason } }
  );
}

module.exports = {
  hashToken,
  signAccessToken,
  issueSession,
  rotateSession,
  revokeSessionByToken,
  revokeAllSessions,
  ACCESS_TOKEN_TTL
};
