
const User = require('../models/User');

const loginAttempts = new Map();

const MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

const trackLoginAttempt = async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next();
  }

  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, firstAttempt: now, lockedUntil: null };

  // Check if account is locked
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    const minutesLeft = Math.ceil((attempts.lockedUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      message: `Account temporarily locked due to too many failed login attempts. Try again in ${minutesLeft} minutes.`,
      lockedUntil: new Date(attempts.lockedUntil).toISOString()
    });
  }

  // Reset if lockout expired
  if (attempts.lockedUntil && now >= attempts.lockedUntil) {
    loginAttempts.delete(email);
    return next();
  }

  // Reset counter if more than lockout duration has passed since first attempt
  if (now - attempts.firstAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(email);
    return next();
  }

  next();
};

const recordFailedLogin = (email) => {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, firstAttempt: now, lockedUntil: null };

  attempts.count++;

  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_DURATION;
    attempts.count = 0;
    attempts.firstAttempt = now;
  }

  loginAttempts.set(email, attempts);
};

const resetLoginAttempts = (email) => {
  loginAttempts.delete(email);
};

module.exports = {
  trackLoginAttempt,
  recordFailedLogin,
  resetLoginAttempts
};
