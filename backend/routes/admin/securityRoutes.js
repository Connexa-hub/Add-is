
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const verifyToken = require('../../middleware/verifyToken');
const isAdmin = require('../../middleware/isAdmin');
const User = require('../../models/User');
const { logSecurityEvent } = require('../../middleware/securityLogger');

const quarantineDir = path.join(__dirname, '../../quarantine');
const scanLogFile = path.join(__dirname, '../../logs/virus-scan.log');

// Get quarantined files
router.get('/quarantine', verifyToken, isAdmin, async (req, res) => {
  try {
    const files = await fs.readdir(quarantineDir);
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(quarantineDir, filename);
        const stats = await fs.stat(filePath);
        return {
          filename,
          size: stats.size,
          quarantinedAt: stats.mtime
        };
      })
    );

    res.json({
      success: true,
      data: {
        count: fileDetails.length,
        files: fileDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quarantined files',
      error: error.message
    });
  }
});

// Get virus scan logs
router.get('/scan-logs', verifyToken, isAdmin, async (req, res) => {
  try {
    const logContent = await fs.readFile(scanLogFile, 'utf-8');
    const logs = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null)
      .reverse()
      .slice(0, 100);

    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    res.json({
      success: true,
      data: { logs: [] }
    });
  }
});

// Delete quarantined file
router.delete('/quarantine/:filename', verifyToken, isAdmin, async (req, res) => {
  try {
    const filePath = path.join(quarantineDir, req.params.filename);
    await fs.unlink(filePath);

    res.json({
      success: true,
      message: 'Quarantined file deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete quarantined file',
      error: error.message
    });
  }
});

// Manual email verification endpoint (fallback when email service fails)
router.post('/manual-verify-email', verifyToken, isAdmin, async (req, res) => {
  try {
    const { email, reason } = req.body;

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
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    user.emailVerified = true;
    user.verificationOTP = undefined;
    user.verificationExpires = undefined;
    await user.save();

    logSecurityEvent('MANUAL_EMAIL_VERIFICATION', {
      adminId: req.userId,
      targetUserId: user._id,
      targetEmail: user.email,
      reason: reason || 'Manual verification by admin',
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Email verified manually',
      data: {
        userId: user._id,
        email: user.email,
        verifiedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message
    });
  }
});

// Get unverified users (for admin review)
router.get('/unverified-users', verifyToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({ emailVerified: false })
      .select('name email createdAt verificationExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ emailVerified: false });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unverified users',
      error: error.message
    });
  }
});

// Cleanup expired unverified accounts
router.post('/cleanup-unverified', verifyToken, isAdmin, async (req, res) => {
  try {
    const { daysOld = 1 } = req.body;
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await User.deleteMany({
      emailVerified: false,
      createdAt: { $lt: cutoffDate }
    });

    logSecurityEvent('CLEANUP_UNVERIFIED_ACCOUNTS', {
      adminId: req.userId,
      deletedCount: result.deletedCount,
      daysOld,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} unverified accounts`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

// Test email sending endpoint
router.post('/test-email', verifyToken, isAdmin, async (req, res) => {
  try {
    const { to, testType } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const emailService = require('../../utils/emailService');
    
    let result;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    switch (testType) {
      case 'verification':
        result = await emailService.sendVerificationEmail(to, otp);
        break;
      case 'password_reset':
        result = await emailService.sendPasswordResetEmail({ email: to, name: 'Test User' }, otp);
        break;
      case 'welcome':
        result = await emailService.sendWelcomeEmail({ email: to, name: 'Test User' });
        break;
      default:
        result = await emailService.sendEmail(
          to,
          'Test Email from VTU247 Admin',
          `<h2>Test Email</h2><p>This is a test email sent from the admin panel at ${new Date().toLocaleString()}.</p><p>If you received this, the email service is working correctly!</p>`
        );
    }

    logSecurityEvent('EMAIL_TEST_SENT', {
      adminId: req.userId,
      recipient: to,
      testType: testType || 'basic',
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        messageId: result.messageId,
        recipient: to,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error('Email test failed:', error);
    
    res.status(500).json({
      success: false,
      message: error.isEmailConfigError 
        ? 'Email service not configured. Please check EMAIL_USER and EMAIL_PASS environment variables.'
        : `Failed to send test email: ${error.message}`,
      error: error.message,
      isConfigError: error.isEmailConfigError || false
    });
  }
});

module.exports = router;
