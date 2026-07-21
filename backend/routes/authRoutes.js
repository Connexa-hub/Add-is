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
const { issueSession, rotateSession, revokeSessionByToken, revokeAllSessions } = require('../utils/authSession');
const Session = require('../models/Session');
const { generateOTP } = require('../utils/otp');
const {
  getWalletBalance,
  fundWallet,
  getWalletTransactions
} = require('../controllers/walletController');
const { registerValidation, loginValidation, profileUpdateValidation, walletFundValidation, transactionQueryValidation } = require('../middleware/validation');
const { redactEmail, redactAccountNumber, debugLog } = require('../utils/redact');

// Verify token endpoint
router.get('/verify-token', verifyToken, async (req, res) => {
  try {
    res.json({ valid: true, userId: req.user.userId });
  } catch (error) {
    res.status(401).json({ valid: false, error: error.message });
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Auto-create virtual account if not exists - ALWAYS for sandbox/testing
    debugLog('🔍 Checking Monnify accounts for user:', redactEmail(user.email));
    debugLog('Current monnifyAccounts count:', user.monnifyAccounts?.length || 0);
    debugLog('Has monnifyAccountReference:', !!user.monnifyAccountReference);

    if (!user.monnifyAccounts || user.monnifyAccounts.length === 0) {
      debugLog('⚠️ User has no Monnify accounts, attempting to create/fetch for user:', redactEmail(user.email));

      // Automatic Monnify account provisioning
      const accountReference = `USER_${user._id}`;

      // Check if we have a monnifyAccountReference but no accounts array
      if (user.monnifyAccountReference && (!user.monnifyAccounts || user.monnifyAccounts.length === 0)) {
        try {
          debugLog('🔄 Fetching existing Monnify account reference (redacted length):', user.monnifyAccountReference?.length || 0);
          const accountDetails = await monnifyClient.getReservedAccountDetails(user.monnifyAccountReference);
          debugLog('📥 Account details response received:', accountDetails?.success);

          if (accountDetails.success && accountDetails.data && accountDetails.data.accounts) {
            user.monnifyAccounts = accountDetails.data.accounts.map(acc => ({
              accountNumber: acc.accountNumber,
              accountName: acc.accountName,
              bankName: acc.bankName,
              bankCode: acc.bankCode,
              reservationReference: acc.reservationReference,
              collectionChannel: acc.collectionChannel
            }));
            await user.save();
            debugLog('✅ Monnify accounts fetched and saved:', user.monnifyAccounts.length);
          } else {
            console.error('❌ Failed to fetch - clearing invalid reference');
            user.monnifyAccountReference = null;
          }
        } catch (error) {
          console.error('❌ Failed to fetch existing account details:', error.message);
          user.monnifyAccountReference = null;
        }
      }

      // If still no accounts, try to create or fetch existing ones
      if (!user.monnifyAccounts || user.monnifyAccounts.length === 0) {
        try {
          debugLog('🔄 Processing Monnify account for', redactEmail(user.email));

          // createReservedAccount now handles R42 errors internally and auto-retrieves
          const monnifyResult = await monnifyClient.createReservedAccount({
            accountReference,
            accountName: user.name,
            customerEmail: user.email,
            customerName: user.name
          });

          if (monnifyResult.success && monnifyResult.data) {
            const accounts = monnifyResult.data.accounts || [];

            if (accounts.length > 0) {
              user.monnifyAccountReference = accountReference;
              user.monnifyAccounts = accounts.map(acc => ({
                accountNumber: acc.accountNumber,
                accountName: acc.accountName,
                bankName: acc.bankName,
                bankCode: acc.bankCode,
                reservationReference: acc.reservationReference,
                collectionChannel: acc.collectionChannel
              }));
              await user.save();
              debugLog(`✅ Saved ${accounts.length} account(s) for ${redactEmail(user.email)}`);
              debugLog('Accounts:', user.monnifyAccounts.map(a => `${a.bankName}: ${redactAccountNumber(a.accountNumber)}`).join(', '));
            } else {
              console.error('❌ No accounts found in response');
            }
          } else {
            console.error('❌ Monnify operation failed:', monnifyResult);
          }
        } catch (error) {
          console.error('❌ Monnify account processing error:', error.message);
          if (error.response?.data) {
            console.error('Monnify API error:', JSON.stringify(error.response.data, null, 2));
          }
        }
      } else {
        debugLog('✅ User has existing Monnify accounts:', user.monnifyAccounts.length);
      }
    }

    // Log what we're sending back
    debugLog(`📤 Sending profile for ${redactEmail(user.email)}:`);
    debugLog('   Has Monnify Reference:', !!user.monnifyAccountReference);
    debugLog(`   Monnify Accounts: ${user.monnifyAccounts?.length || 0}`);
    if (user.monnifyAccounts && user.monnifyAccounts.length > 0) {
      user.monnifyAccounts.forEach((acc, idx) => {
        debugLog(`   ${idx + 1}. ${acc.bankName}: ${redactAccountNumber(acc.accountNumber)}`);
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        walletBalance: user.walletBalance,
        virtualAccountNumber: user.virtualAccountNumber,
        isVerified: user.emailVerified,
        role: user.role,
        kyc: user.kyc,
        biometricEnabled: user.biometricEnabled,
        monnifyAccountReference: user.monnifyAccountReference,
        monnifyAccounts: user.monnifyAccounts || []
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

    const otp = generateOTP();

    const newUser = await User.create({
      name,
      email,
      password: hashed,
      verificationOTP: otp,
      verificationExpires: Date.now() + 3600000,
      emailVerified: false
    });

    // Create Monnify reserved account for the user
    try {
      const accountReference = `USER_${newUser._id}`;
      debugLog(`🔄 Creating Monnify account for ${redactEmail(newUser.email)} with reference: ${accountReference}`);

      const monnifyResult = await monnifyClient.createReservedAccount({
        accountReference,
        accountName: name,
        customerEmail: email,
        customerName: name,
      });

      debugLog('📥 Monnify result received, success:', monnifyResult?.success);

      if (monnifyResult.success && monnifyResult.data) {
        const accounts = monnifyResult.data.accounts || [];

        console.log(`📊 Accounts received from Monnify: ${accounts.length}`);

        if (accounts.length > 0) {
          newUser.monnifyAccountReference = accountReference;
          newUser.monnifyAccounts = accounts.map(acc => ({
            accountNumber: acc.accountNumber,
            accountName: acc.accountName,
            bankName: acc.bankName,
            bankCode: acc.bankCode,
            reservationReference: acc.reservationReference || monnifyResult.data.reservationReference,
            collectionChannel: acc.collectionChannel || 'RESERVED_ACCOUNT',
          }));

          // Save the user with Monnify accounts
          await newUser.save();

          // Verify the save
          const verifiedUser = await User.findById(newUser._id);
          debugLog(`✅ Monnify account created and saved:`);
          console.log(`   Reference: ${verifiedUser.monnifyAccountReference}`);
          console.log(`   Accounts in DB: ${verifiedUser.monnifyAccounts.length}`);
          verifiedUser.monnifyAccounts.forEach((acc, idx) => {
            debugLog(`   ${idx + 1}. ${acc.bankName}: ${redactAccountNumber(acc.accountNumber)}`);
          });
        } else {
          console.error('❌ No accounts returned from Monnify');
          console.error('   Monnify account creation returned no accounts');
        }
      } else {
        console.error('❌ Monnify account creation failed:', monnifyResult);
      }
    } catch (monnifyError) {
      console.error('❌ Monnify account creation error:', monnifyError.message);
      if (monnifyError.stack) {
        console.error('   Stack:', monnifyError.stack);
      }
      // Don't fail registration if Monnify fails, continue
    }

    await newUser.save();

    let emailSent = false;
    try {
      await emailService.sendVerificationEmail(newUser.email, otp);
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send verification email during registration:', emailError);

      // Don't delete user - allow them to proceed to verification screen
      // They can resend the verification email from there
      if (emailError.isEmailConfigError) {
        console.error('Email service not configured - user created but email not sent');
      }
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Registration successful! Please verify your email.'
        : 'Registration successful! Email service unavailable - please use resend or contact support.',
      data: {
        email: newUser.email,
        emailSent: emailSent
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

    if (!user) {
      recordFailedLogin(email);
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
        email,
        ip: req.ip || req.connection.remoteAddress,
        reason: 'account_not_found'
      });
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please sign up to create a new account.',
        accountNotFound: true
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      recordFailedLogin(email);
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
        email,
        ip: req.ip || req.connection.remoteAddress,
        reason: 'invalid_password'
      });
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    if (!user.emailVerified) {
      // Generate new OTP and resend verification email
      const otp = generateOTP();
      user.verificationOTP = otp;
      user.verificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
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

    // Update last login
    user.lastLogin = new Date();

    // Create Monnify account if it doesn't exist
    if (!user.monnifyAccounts || user.monnifyAccounts.length === 0) {
      try {
        const accountReference = `USER_${user._id}`;
        debugLog('Creating missing Monnify account for:', redactEmail(user.email));

        const monnifyResult = await monnifyClient.createReservedAccount({
          accountReference,
          accountName: user.name,
          customerEmail: user.email,
          customerName: user.name,
        });

        if (monnifyResult.success && monnifyResult.data) {
          const accounts = monnifyResult.data.accounts || [];
          user.monnifyAccountReference = accountReference;
          user.monnifyAccounts = accounts.map(acc => ({
            accountNumber: acc.accountNumber,
            accountName: acc.accountName,
            bankName: acc.bankName,
            bankCode: acc.bankCode,
            reservationReference: acc.reservationReference,
            collectionChannel: acc.collectionChannel
          }));
          debugLog('Monnify accounts created on login, count:', user.monnifyAccounts.length);
        }
      } catch (monnifyError) {
        console.error('Error creating Monnify account on login:', monnifyError.message);
      }
    }

    await user.save();

    const { accessToken, refreshToken } = await issueSession(user, req, req.body.deviceLabel);

    logSecurityEvent('SUCCESSFUL_LOGIN', {
      userId: user._id,
      email,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        // `token` kept for backward compatibility with any client still
        // reading the old field name — treat it as the access token.
        token: accessToken,
        accessToken,
        refreshToken,
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

// Exchange a refresh token for a new access token (and a new, rotated
// refresh token). Access tokens last 15 minutes — clients are expected to
// call this whenever a request comes back 401/TOKEN_EXPIRED.
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'refreshToken is required' });
    }

    // We need to know which user this token belongs to before we can look
    // up the session (the session lookup is scoped by userId). The refresh
    // token itself doesn't carry the user id, so we find the session by
    // hash first without the userId filter, purely to identify the user,
    // then re-run the real validation inside rotateSession scoped to them.
    const { hashToken } = require('../utils/authSession');
    const candidate = await Session.findOne({ refreshTokenHash: hashToken(refreshToken) });
    if (!candidate) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }

    const user = await User.findById(candidate.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }

    const result = await rotateSession(refreshToken, user, req);

    if (!result.ok) {
      if (result.reason === 'reuse_detected') {
        logSecurityEvent('REFRESH_TOKEN_REUSE_DETECTED', {
          userId: user._id,
          email: user.email,
          ip: req.ip || req.connection.remoteAddress
        });
        return res.status(401).json({
          success: false,
          message: 'This session is no longer valid. Please log in again.',
          code: 'SESSION_REVOKED'
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }

    res.json({
      success: true,
      data: {
        token: result.accessToken,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

// Log out the current device only (revokes just this refresh token's session).
router.post('/logout', verifyToken, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeSessionByToken(refreshToken, req.userId);
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
});

// Log out of every device. Bumps tokenVersion so any access token still
// held by another device stops working within one verifyToken check
// (up to 15 minutes, its max remaining lifetime), not just when its
// refresh token is next used.
router.post('/logout-all', verifyToken, async (req, res, next) => {
  try {
    await revokeAllSessions(req.userId, 'logout_all');
    await User.updateOne({ _id: req.userId }, { $inc: { tokenVersion: 1 } });

    logSecurityEvent('LOGOUT_ALL_DEVICES', {
      userId: req.userId,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ success: true, message: 'Logged out of all devices' });
  } catch (error) {
    next(error);
  }
});

// List this user's active sessions/devices.
router.get('/sessions', verifyToken, async (req, res, next) => {
  try {
    const { hashToken } = require('../utils/authSession');
    const currentRefreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;

    const sessions = await Session.find({
      userId: req.userId,
      revoked: false,
      expiresAt: { $gt: new Date() }
    }).sort({ lastUsedAt: -1 }).lean();

    res.json({
      success: true,
      data: sessions.map(s => ({
        id: s._id,
        deviceLabel: s.deviceLabel,
        ip: s.ip,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        isCurrent: currentHash ? s.refreshTokenHash === currentHash : false
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Revoke a specific session/device by id.
router.delete('/sessions/:sessionId', verifyToken, async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    await Session.updateOne(
      { _id: session._id },
      { $set: { revoked: true, revokedReason: 'logout' } }
    );
    res.json({ success: true, message: 'Device logged out' });
  } catch (error) {
    next(error);
  }
});

// Registers (or re-registers/rotates) a biometric credential for ONE
// specific device. The raw credential is returned to the client exactly
// once and must be stored via the OS keystore gated behind biometric
// unlock (e.g. Expo SecureStore with `requireAuthentication: true`) — only
// its SHA-256 hash is kept server-side, matching how refresh tokens are
// stored. Re-enabling for a deviceId that's already registered replaces
// (rotates) that device's credential; it does not touch other devices.
router.post('/enable-biometric', verifyToken, async (req, res, next) => {
  try {
    const { deviceId, deviceLabel } = req.body;
    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required — generate and persist a stable UUID per app install on the client.'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before enabling biometric login'
      });
    }

    const rawCredential = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawCredential).digest('hex');

    user.biometricDevices = (user.biometricDevices || []).filter(d => d.deviceId !== deviceId);
    if (user.biometricDevices.length >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum number of biometric-enabled devices reached. Remove an existing device first.'
      });
    }
    user.biometricDevices.push({
      deviceId,
      tokenHash,
      label: deviceLabel || 'Unknown device',
      createdAt: new Date()
    });
    user.biometricEnabled = true;
    await user.save();

    logSecurityEvent('BIOMETRIC_ENABLED', {
      userId: user._id,
      email: user.email,
      deviceId,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      message: 'Biometric authentication enabled successfully',
      data: {
        // Client must store this behind the OS biometric-gated keystore and
        // never persist it anywhere else. It rotates on every successful
        // biometric login — treat the value returned here (or by
        // /biometric-login) as the only copy that will ever be valid.
        biometricToken: rawCredential,
        deviceId
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/biometric-login', async (req, res, next) => {
  try {
    const { biometricToken, deviceId } = req.body;

    if (!biometricToken || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'biometricToken and deviceId are required'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(biometricToken).digest('hex');
    const user = await User.findOne({
      biometricDevices: { $elemMatch: { deviceId, tokenHash } }
    });

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

    // Rotate the credential — a captured/replayed token only ever works
    // once, same principle as refresh-token rotation above.
    const newRawCredential = crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawCredential).digest('hex');
    await User.updateOne(
      { _id: user._id, 'biometricDevices.deviceId': deviceId },
      {
        $set: {
          'biometricDevices.$.tokenHash': newTokenHash,
          'biometricDevices.$.lastUsedAt': new Date(),
          lastLogin: new Date()
        }
      }
    );

    const { accessToken, refreshToken } = await issueSession(user, req);

    logSecurityEvent('BIOMETRIC_LOGIN', {
      userId: user._id,
      email: user.email,
      deviceId,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      message: 'Biometric login successful',
      data: {
        token: accessToken,
        accessToken,
        refreshToken,
        // Client must overwrite its stored biometricToken with this new
        // value — the one just used is no longer valid.
        biometricToken: newRawCredential,
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

// Remove biometric login for one specific device (e.g. "forget this phone").
router.delete('/biometric-devices/:deviceId', verifyToken, async (req, res, next) => {
  try {
    await User.updateOne(
      { _id: req.userId },
      { $pull: { biometricDevices: { deviceId: req.params.deviceId } } }
    );
    res.json({ success: true, message: 'Biometric device removed' });
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
    const otp = generateOTP();

    // Store OTP with expiry (1 hour)
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
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
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // If someone else's session was live on this account (e.g. the reset
    // was triggered because of a suspected compromise), a password reset
    // should kick every device out, not just the one doing the reset.
    await revokeAllSessions(user._id, 'password_changed');

    logSecurityEvent('PASSWORD_RESET', {
      userId: user._id,
      email: user.email,
      ip: req.ip || req.connection.remoteAddress
    });

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

    const { accessToken, refreshToken } = await issueSession(user, req);

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome aboard!',
      data: {
        token: accessToken,
        accessToken,
        refreshToken,
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

    const otp = generateOTP();

    user.verificationOTP = otp;
    user.verificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
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

    // Deallocate Monnify reserved account if exists
    if (user.monnifyAccountReference) {
      try {
        debugLog('Attempting to deallocate Monnify account for user:', redactEmail(user.email));
        const deallocateResult = await monnifyClient.deallocateReservedAccount(user.monnifyAccountReference);

        if (deallocateResult.success) {
          debugLog('✅ Successfully deallocated Monnify account for user:', redactEmail(user.email));
          logSecurityEvent('MONNIFY_ACCOUNT_DEALLOCATED', {
            userId: user._id,
            email: user.email,
            accountReference: user.monnifyAccountReference,
            timestamp: new Date()
          });
        } else {
          console.log(`⚠️ Failed to deallocate Monnify account: ${deallocateResult.message}`);
          logSecurityEvent('MONNIFY_DEALLOCATION_FAILED', {
            userId: user._id,
            email: user.email,
            accountReference: user.monnifyAccountReference,
            error: deallocateResult.message,
            timestamp: new Date()
          });
        }
      } catch (monnifyError) {
        console.error(`❌ Error deallocating Monnify account:`, monnifyError.message);
        logSecurityEvent('MONNIFY_DEALLOCATION_ERROR', {
          userId: user._id,
          email: user.email,
          accountReference: user.monnifyAccountReference,
          error: monnifyError.message,
          timestamp: new Date()
        });
      }
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
      message: 'Account and all associated data deleted successfully. Monnify virtual account has been deallocated.'
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