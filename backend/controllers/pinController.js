const User = require('../models/User');
const bcrypt = require('bcryptjs');

const MAX_PIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000;

const setupPin = async (req, res) => {
  try {
    const userId = req.userId;
    const { pin, confirmPin } = req.body;

    if (!pin || !confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'PIN and confirmation are required'
      });
    }

    if (pin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'PINs do not match'
      });
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be 4-6 digits'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.transactionPin && user.transactionPin.isSet) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is already set. Use change PIN instead.'
      });
    }

    const hash = await bcrypt.hash(pin, 10);

    user.transactionPin = {
      hash,
      isSet: true,
      failedAttempts: 0,
      lastChanged: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Transaction PIN set successfully'
    });
  } catch (error) {
    console.error('Setup PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup PIN',
      error: error.message
    });
  }
};

const verifyPin = async (req, res) => {
  try {
    const userId = req.userId;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN is required'
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
        message: 'Transaction PIN is not set'
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

    const isValid = await bcrypt.compare(pin, user.transactionPin.hash);

    if (!isValid) {
      user.transactionPin.failedAttempts = (user.transactionPin.failedAttempts || 0) + 1;

      if (user.transactionPin.failedAttempts >= MAX_PIN_ATTEMPTS) {
        user.transactionPin.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
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
        message: 'Invalid PIN',
        remainingAttempts: MAX_PIN_ATTEMPTS - user.transactionPin.failedAttempts
      });
    }

    user.transactionPin.failedAttempts = 0;
    user.transactionPin.lockedUntil = null;
    await user.save();

    res.json({
      success: true,
      message: 'PIN verified successfully'
    });
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify PIN',
      error: error.message
    });
  }
};

const changePin = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPin, newPin, confirmNewPin } = req.body;

    if (!currentPin || !newPin || !confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'Current PIN, new PIN, and confirmation are required'
      });
    }

    if (newPin !== confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'New PINs do not match'
      });
    }

    if (!/^\d{4,6}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be 4-6 digits'
      });
    }

    const user = await User.findById(userId);

    if (!user || !user.transactionPin || !user.transactionPin.isSet) {
      return res.status(400).json({
        success: false,
        message: 'Transaction PIN is not set'
      });
    }

    const isValid = await bcrypt.compare(currentPin, user.transactionPin.hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current PIN is incorrect'
      });
    }

    const hash = await bcrypt.hash(newPin, 10);

    user.transactionPin.hash = hash;
    user.transactionPin.lastChanged = new Date();
    user.transactionPin.failedAttempts = 0;
    user.transactionPin.lockedUntil = null;

    await user.save();

    res.json({
      success: true,
      message: 'Transaction PIN changed successfully'
    });
  } catch (error) {
    console.error('Change PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change PIN',
      error: error.message
    });
  }
};

const getPinStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('transactionPin biometricEnabled');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        isPinSet: user.transactionPin?.isSet || false,
        lastChanged: user.transactionPin?.lastChanged,
        biometricEnabled: user.biometricEnabled || false,
        isLocked: user.transactionPin?.lockedUntil && user.transactionPin.lockedUntil > new Date()
      }
    });
  } catch (error) {
    console.error('Get PIN status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get PIN status',
      error: error.message
    });
  }
};

const toggleBiometric = async (req, res) => {
  try {
    const userId = req.userId;
    const { enabled } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.biometricEnabled = enabled === true;
    await user.save();

    res.json({
      success: true,
      message: `Biometric authentication ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        biometricEnabled: user.biometricEnabled
      }
    });
  } catch (error) {
    console.error('Toggle biometric error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle biometric',
      error: error.message
    });
  }
};

const requestPinReset = async (req, res) => {
  try {
    const userId = req.userId;

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
        message: 'No transaction PIN is set for this account'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPinOTP = otp;
    user.resetPinExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send email
    const emailService = require('../utils/emailService');
    await emailService.sendPinResetEmail(user, otp);

    res.json({
      success: true,
      message: 'PIN reset code sent to your email',
      data: {
        email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email
      }
    });
  } catch (error) {
    console.error('Request PIN reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request PIN reset',
      error: error.message
    });
  }
};

const verifyPinResetOTP = async (req, res) => {
  try {
    const userId = req.userId;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.resetPinOTP || !user.resetPinExpires) {
      return res.status(400).json({
        success: false,
        message: 'No PIN reset request found. Please request a new code.'
      });
    }

    if (user.resetPinExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.'
      });
    }

    if (user.resetPinOTP !== otp) {
      return res.status(401).json({
        success: false,
        message: 'Invalid reset code'
      });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15);
    user.pinResetToken = resetToken;
    user.pinResetTokenExpires = new Date(Date.now() + 600000); // 10 minutes
    await user.save();

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        resetToken
      }
    });
  } catch (error) {
    console.error('Verify PIN reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
};

const resetPin = async (req, res) => {
  try {
    const userId = req.userId;
    const { resetToken, newPin, confirmNewPin } = req.body;

    if (!resetToken || !newPin || !confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'Reset token, new PIN, and confirmation are required'
      });
    }

    if (newPin !== confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'New PINs do not match'
      });
    }

    if (!/^\d{4,6}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be 4-6 digits'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.pinResetToken || !user.pinResetTokenExpires) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset request. Please verify OTP first.'
      });
    }

    if (user.pinResetTokenExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset session expired. Please start over.'
      });
    }

    if (user.pinResetToken !== resetToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    const hash = await bcrypt.hash(newPin, 10);

    user.transactionPin.hash = hash;
    user.transactionPin.lastChanged = new Date();
    user.transactionPin.failedAttempts = 0;
    user.transactionPin.lockedUntil = null;
    
    // Clear reset fields
    user.resetPinOTP = undefined;
    user.resetPinExpires = undefined;
    user.pinResetToken = undefined;
    user.pinResetTokenExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Transaction PIN reset successfully'
    });
  } catch (error) {
    console.error('Reset PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset PIN',
      error: error.message
    });
  }
};

module.exports = {
  setupPin,
  verifyPin,
  changePin,
  getPinStatus,
  toggleBiometric,
  requestPinReset,
  verifyPinResetOTP,
  resetPin
};
