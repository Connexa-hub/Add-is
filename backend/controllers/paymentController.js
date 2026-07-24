const User = require('../models/User');
const Transaction = require('../models/Transaction');
const monnifyClient = require('../utils/monnifyClient');
const {
  FundingError,
  coreInitializeFunding,
  coreVerifyFunding,
  coreProcessMonnifyWebhook
} = require('../utils/walletFundingCore');

// initializePayment / verifyPayment / monnifyWebhook below are thin wrappers
// around the shared funding core (backend/utils/walletFundingCore.js).
// This file used to have its own complete, independent copy of the funding
// logic, running simultaneously with walletFundingController.js at a
// different URL — consolidated in Phase 3 (see ROADMAP.md). Both this route
// (/api/payment/*) and /api/wallet/funding/* stay live and now run the
// exact same underlying code, since it isn't knowable from the repo alone
// which webhook URL is actually configured in Monnify's dashboard.

exports.initializePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const { transaction, monnifyData } = await coreInitializeFunding(req.userId, amount);

    res.json({
      success: true,
      data: {
        reference: transaction.paymentReference,
        amount: transaction.amount,
        checkoutUrl: monnifyData.checkoutUrl,
        transactionReference: transaction.monnifyTransactionReference,
        paymentReference: transaction.monnifyPaymentReference
      }
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    const statusCode = error instanceof FundingError ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to initialize payment'
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await coreVerifyFunding(req.userId, reference);

    if (result.status === 'completed') {
      return res.json({
        success: true,
        message: result.alreadyProcessed ? 'Payment already verified' : 'Payment verified successfully',
        data: result.alreadyProcessed ? result.transaction : {
          transaction: result.transaction,
          newBalance: result.newBalance,
          cardData: result.cardData
        }
      });
    }

    res.status(400).json({
      success: false,
      message: 'Payment not completed',
      status: result.status
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    const statusCode = error instanceof FundingError ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
};

exports.monnifyWebhook = async (req, res) => {
  try {
    const signature = req.headers['monnify-signature'];
    const payload = req.body;

    if (!signature || !monnifyClient.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    console.log('Monnify webhook received:', payload.eventType);
    const result = await coreProcessMonnifyWebhook(payload.eventType, payload.eventData);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

exports.createVirtualAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.monnifyAccounts && user.monnifyAccounts.length > 0) {
      return res.json({
        success: true,
        message: 'Virtual account already exists',
        data: user.monnifyAccounts
      });
    }

    if (!user.kyc || user.kyc.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'KYC verification must be approved before creating virtual account'
      });
    }

    if (!user.kyc.personal.bvn && !user.kyc.personal.nin) {
      return res.status(400).json({
        success: false,
        message: 'BVN or NIN is required for virtual account creation (CBN regulation)'
      });
    }

    const accountReference = `USER_${userId}_${Date.now()}`;

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
        bankCode: acc.bankCode,
        reservationReference: acc.reservationReference,
        collectionChannel: acc.collectionChannel
      }));
      await user.save();

      res.json({
        success: true,
        message: 'Virtual account created successfully',
        data: user.monnifyAccounts
      });
    } else {
      throw new Error('Failed to create virtual account');
    }
  } catch (error) {
    console.error('Virtual account creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create virtual account'
    });
  }
};

exports.getVirtualAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.monnifyAccounts || user.monnifyAccounts.length === 0) {
      return res.json({
        success: true,
        message: 'No virtual account found',
        data: null
      });
    }

    res.json({
      success: true,
      data: user.monnifyAccounts
    });
  } catch (error) {
    console.error('Get virtual account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch virtual account'
    });
  }
};

exports.getMonnifyBalance = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const result = await monnifyClient.getAccountBalance();

    res.json({
      success: true,
      data: {
        balance: result.balance,
        details: result.data
      }
    });
  } catch (error) {
    console.error('Get Monnify balance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Monnify balance'
    });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const transactions = await Transaction.find({
      user: userId,
      category: 'wallet_funding'
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments({
      user: userId,
      category: 'wallet_funding'
    });

    res.json({
      success: true,
      data: {
        transactions,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
};
