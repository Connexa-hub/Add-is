const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const emailService = require('../utils/emailService');
const { registerValidation, loginValidation, profileUpdateValidation, walletFundValidation, transactionQueryValidation } = require('../middleware/validation');
const {
  getWalletBalance,
  fundWallet,
  getWalletTransactions
} = require('../controllers/walletController');
const { trackLoginAttempt, recordFailedLogin, resetLoginAttempts } = require('../middleware/accountLockout');
const { logSecurityEvent } = require('../middleware/securityLogger');

router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Auto-create virtual account if not exists (only if KYC approved with BVN/NIN)
    if (!user.monnifyAccounts || user.monnifyAccounts.length === 0) {
      if (user.kyc && user.kyc.status === 'approved' && user.kyc.personal && (user.kyc.personal.bvn || user.kyc.personal.nin)) {
        try {
          const monnifyClient = require('../utils/monnifyClient');
          const accountReference = `USER_${user._id}_${Date.now()}`;
          const result = await monnifyClient.createReservedAccount({
            accountReference,
            accountName: user.name,
            customerEmail: user.email,
            customerName: user.name,
            bvn: user.kyc.personal.bvn,
            nin: user.kyc.personal.nin
          });

          if (result.success) {
            user.monnifyAccountReference = accountReference;
            user.monnifyAccounts = result.data.accounts.map(acc => ({
              accountNumber: acc.accountNumber,
              accountName: acc.accountName,
              bankName: acc.bankName,
              bankCode: acc.bankCode
            }));
            await user.save();
          }
        } catch (error) {
          console.error('Auto virtual account creation failed:', error);
        }
      }
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
        walletBalance: user.walletBalance,
        virtualAccountNumber: user.virtualAccountNumber,
        createdAt: user.createdAt,
        monnifyAccounts: user.monnifyAccounts,
        monnifyAccountReference: user.monnifyAccountReference,
        kyc: {
          status: user.kyc?.status || 'not_submitted',
          tier: user.kyc?.status === 'approved' ? (user.kyc?.personal?.bvn || user.kyc?.personal?.nin ? 'tier2' : 'tier1') : 'unverified'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/wallet', verifyToken, getWalletBalance);
router.post('/wallet/fund', verifyToken, walletFundValidation, fundWallet);
router.get('/wallet/transactions', verifyToken, transactionQueryValidation, getWalletTransactions);

router.put('/profile', verifyToken, profileUpdateValidation, async (req, res, next) => {
  try {
    const { name, phoneNumber, profilePicture } = req.body; // Added phoneNumber and profilePicture

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber; // Update phone number
    if (profilePicture) user.profilePicture = profilePicture; // Update profile picture

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber, // Include phone number
        profilePicture: user.profilePicture // Include profile picture
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email,
      password: hashed,
      verificationOTP: otp,
      verificationExpires: Date.now() + 3600000,
      emailVerified: false
    });

    try {
      const monnifyClient = require('../utils/monnifyClient');
      const accountReference = `USER_${user._id}_${Date.now()}`;

      const reservedAccountResult = await monnifyClient.createReservedAccount({
        accountReference,
        accountName: name,
        customerEmail: email,
        customerName: name
      });

      if (reservedAccountResult.success && reservedAccountResult.data) {
        const accounts = reservedAccountResult.data.accounts || [];
        user.monnifyAccountReference = accountReference;
        user.monnifyAccounts = accounts.map(acc => ({
          accountNumber: acc.accountNumber,
          accountName: acc.accountName,
          bankName: acc.bankName,
          bankCode: acc.bankCode
        }));
        await user.save();
      }
    } catch (monnifyError) {
      console.error('Monnify account creation failed:', monnifyError.message);
    }

    const { sendVerificationEmail } = require('../utils/emailService');
    await sendVerificationEmail(user, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      data: {
        email: user.email,
        requiresVerification: true
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', trackLoginAttempt, loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      recordFailedLogin(email);
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
        email,
        ip: req.ip || req.connection.remoteAddress,
        reason: !user ? 'user_not_found' : 'invalid_password'
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    resetLoginAttempts(email);

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logSecurityEvent('SUCCESSFUL_LOGIN', {
      userId: user._id,
      email,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          isEmailVerified: user.emailVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/biometric-login', async (req, res, next) => {
  try {
    const { biometricToken } = req.body;

    if (!biometricToken) {
      return res.status(400).json({
        success: false,
        message: 'Biometric token is required'
      });
    }

    const user = await User.findOne({ biometricToken });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Biometric authentication failed'
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Biometric login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          emailVerified: user.emailVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (1 hour)
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with OTP
    const { sendPasswordResetEmail } = require('../utils/emailService');
    await sendPasswordResetEmail(user, otp);

    res.json({
      success: true,
      message: 'Password reset code sent to your email'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    const user = await User.findOne({
      email,
      verificationOTP: otp,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    user.emailVerified = true;
    user.verificationOTP = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const { sendWelcomeEmail } = require('../utils/emailService');
    await sendWelcomeEmail(user);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome aboard!',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          virtualAccountNumber: user.virtualAccountNumber,
          emailVerified: user.emailVerified,
          phoneNumber: user.phoneNumber,
          profilePicture: user.profilePicture,
          monnifyAccounts: user.monnifyAccounts,
          monnifyAccountReference: user.monnifyAccountReference
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationOTP = otp;
    user.verificationExpires = Date.now() + 3600000;
    await user.save();

    const { sendVerificationEmail } = require('../utils/emailService');
    await sendVerificationEmail(user, otp);

    res.json({
      success: true,
      message: 'Verification code resent to your email'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;