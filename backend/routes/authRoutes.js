const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const { trackLoginAttempt, recordFailedLogin, resetLoginAttempts } = require('../middleware/accountLockout');
const { logSecurityEvent } = require('../middleware/securityLogger');
const crypto = require('crypto');
const emailService = require('../utils/emailService');
const monnifyClient = require('../utils/monnifyClient');
const {
  getWalletBalance,
  fundWallet,
  getWalletTransactions
} = require('../controllers/walletController');
const { registerValidation, loginValidation, profileUpdateValidation, walletFundValidation, transactionQueryValidation } = require('../middleware/validation');

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
      if (!existingUser.emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Account exists but email not verified. Please verify your email.',
          requiresVerification: true,
          email: existingUser.email
        });
      }
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists. Please login instead.'
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

    await user.save();
    
    try {
      await emailService.sendVerificationEmail(user.email, otp);
    } catch (emailError) {
      console.error('Failed to send verification email during registration:', emailError);
      await User.findByIdAndDelete(user._id);
      
      if (emailError.isEmailConfigError) {
        return res.status(503).json({
          success: false,
          message: 'Email service is not configured. Please contact support to complete registration.',
          errorCode: 'EMAIL_SERVICE_UNAVAILABLE'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again or contact support.',
        errorCode: 'EMAIL_SEND_FAILED'
      });
    }

    // Create Monnify virtual account in background
    try {
      const accountReference = `USER_${user._id}`;
      const monnifyResult = await monnifyClient.createReservedAccount({
        accountReference,
        accountName: user.name,
        customerEmail: user.email,
        customerName: user.name
      });

      if (monnifyResult.success && monnifyResult.data.accounts) {
        user.monnifyAccountReference = accountReference;
        user.monnifyAccounts = monnifyResult.data.accounts.map(acc => ({
          accountNumber: acc.accountNumber,
          accountName: acc.accountName,
          bankName: acc.bankName,
          bankCode: acc.bankCode
        }));
        await user.save();
      }
    } catch (monnifyError) {
      console.error('Monnify account creation failed:', monnifyError);
      // Don't fail registration if Monnify fails
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email.',
      data: { email: user.email }
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
      // Generate new OTP and resend verification email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOTP = otp;
      user.verificationExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send verification email
      let emailSent = false;
      let emailErrorMessage = null;
      
      try {
        await emailService.sendVerificationEmail(user.email, otp);
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send verification email during login:', emailError);
        if (emailError.isEmailConfigError) {
          emailErrorMessage = 'Email service is currently unavailable. Please contact support for manual verification.';
        } else {
          emailErrorMessage = 'Failed to send verification email. Please try the resend option or contact support.';
        }
      }

      return res.status(403).json({
        success: false,
        message: emailSent 
          ? 'Please verify your email before logging in. A new verification code has been sent to your email.'
          : `Email verification required. ${emailErrorMessage}`,
        requiresVerification: true,
        email: user.email,
        emailSent,
        emailError: emailErrorMessage
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

router.post('/enable-biometric', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before enabling biometric login'
      });
    }

    const biometricToken = crypto.randomBytes(32).toString('hex');
    
    user.biometricToken = biometricToken;
    user.biometricEnabled = true;
    await user.save();

    logSecurityEvent('BIOMETRIC_ENABLED', {
      userId: user._id,
      email: user.email,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      message: 'Biometric authentication enabled successfully',
      data: {
        biometricToken
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

    logSecurityEvent('BIOMETRIC_LOGIN', {
      userId: user._id,
      email: user.email,
      ip: req.ip || req.connection.remoteAddress
    });

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
    try {
      const { sendPasswordResetEmail } = require('../utils/emailService');
      await sendPasswordResetEmail(user, otp);

      res.json({
        success: true,
        message: 'Password reset code sent to your email'
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      
      if (emailError.isEmailConfigError) {
        return res.status(503).json({
          success: false,
          message: 'Email service is currently unavailable. Your reset code has been generated. Please contact support with your email address to receive it.',
          errorCode: 'EMAIL_SERVICE_UNAVAILABLE',
          supportEmail: 'support@vtu247.com'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again or contact support.',
        errorCode: 'EMAIL_SEND_FAILED'
      });
    }
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

    // Send welcome email (non-critical - don't fail verification if it fails)
    try {
      const { sendWelcomeEmail } = require('../utils/emailService');
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Failed to send welcome email (non-critical):', emailError);
      // Don't fail the verification - user is already verified
    }

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

    try {
      const { sendVerificationEmail } = require('../utils/emailService');
      await sendVerificationEmail(user, otp);

      res.json({
        success: true,
        message: 'Verification code resent to your email'
      });
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      
      if (emailError.isEmailConfigError) {
        return res.status(503).json({
          success: false,
          message: 'Email service is currently unavailable. Please contact support for manual verification.',
          errorCode: 'EMAIL_SERVICE_UNAVAILABLE',
          supportEmail: 'support@vtu247.com'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later or contact support.',
        errorCode: 'EMAIL_SEND_FAILED',
        supportEmail: 'support@vtu247.com'
      });
    }
  } catch (error) {
    next(error);
  }
});

router.delete('/delete-account', verifyToken, async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Log account deletion for security audit
    logSecurityEvent('ACCOUNT_DELETION_INITIATED', {
      userId: req.userId,
      email: user.email,
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date()
    });

    // Delete all related data
    const Transaction = require('../models/Transaction');
    const Card = require('../models/Card');
    const Notification = require('../models/Notification');
    const SupportTicket = require('../models/SupportTicket');
    const Cashback = require('../models/Cashback');

    // Delete all database records associated with the user
    await Promise.all([
      Transaction.deleteMany({ userId: req.userId }),
      Card.deleteMany({ userId: req.userId }),
      Notification.deleteMany({ userId: req.userId }),
      SupportTicket.deleteMany({ userId: req.userId }),
      Cashback.deleteMany({ userId: req.userId })
    ]);

    // Note: Monnify virtual accounts cannot be deleted via API
    // They are automatically deactivated when not used
    // Log the account reference for manual deactivation if needed
    if (user.monnifyAccountReference) {
      console.log(`Monnify account reference for deleted user: ${user.monnifyAccountReference}`);
      console.log(`User email: ${user.email}`);
      console.log('Note: Monnify virtual accounts are automatically deactivated after 90 days of inactivity');
    }

    // Send account deletion confirmation email (non-critical - don't fail deletion if it fails)
    try {
      await emailService.sendAccountDeletionEmail(user);
      console.log('Account deletion confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send deletion confirmation email (non-critical):', emailError);
      // Don't fail the deletion if email fails - account is already being deleted
    }

    // Delete user account (final step)
    await User.findByIdAndDelete(req.userId);

    // Log successful deletion
    logSecurityEvent('ACCOUNT_DELETION_COMPLETED', {
      userId: req.userId,
      email: user.email,
      monnifyAccountReference: user.monnifyAccountReference,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Account and all associated data deleted successfully. Monnify virtual accounts will be automatically deactivated.'
    });
  } catch (error) {
    logSecurityEvent('ACCOUNT_DELETION_FAILED', {
      userId: req.userId,
      error: error.message,
      timestamp: new Date()
    });
    next(error);
  }
});

module.exports = router;