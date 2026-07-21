const crypto = require('crypto');

/**
 * Generates a 6-digit numeric OTP using a cryptographically secure random
 * source. Replaces `Math.floor(100000 + Math.random() * 900000)`, which was
 * used for every OTP in this codebase (email verification, password reset,
 * PIN reset) — Math.random() is a fast, non-cryptographic PRNG never
 * intended for security-sensitive values like verification codes.
 * crypto.randomInt is uniformly distributed and drawn from the OS CSPRNG.
 */
function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

module.exports = { generateOTP };
