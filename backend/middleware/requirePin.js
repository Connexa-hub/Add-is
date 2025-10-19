const User = require('../models/User');
const bcrypt = require('bcryptjs');

const requirePin = async (req, res, next) => {
  try {
    const { transactionPin } = req.body;
    const userId = req.userId;

    if (!transactionPin) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is required for this operation',
        requirePin: true
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.transactionPin || !user.transactionPin.isSet) {
      return res.status(400).json({
        success: false,
        message: 'Please set up a transaction PIN first',
        requirePinSetup: true
      });
    }

    if (user.transactionPin.lockedUntil && user.transactionPin.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.transactionPin.lockedUntil - new Date()) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
        lockedUntil: user.transactionPin.lockedUntil
      });
    }

    const isValid = await bcrypt.compare(transactionPin, user.transactionPin.hash);

    if (!isValid) {
      user.transactionPin.failedAttempts = (user.transactionPin.failedAttempts || 0) + 1;

      if (user.transactionPin.failedAttempts >= 3) {
        user.transactionPin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        return res.status(429).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 15 minutes.',
          lockedUntil: user.transactionPin.lockedUntil
        });
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid transaction PIN',
        remainingAttempts: 3 - user.transactionPin.failedAttempts
      });
    }

    user.transactionPin.failedAttempts = 0;
    user.transactionPin.lockedUntil = null;
    await user.save();

    next();
  } catch (error) {
    console.error('PIN verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify PIN',
      error: error.message
    });
  }
};

module.exports = requirePin;
