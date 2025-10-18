
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

// Paystack configuration (replace with your actual keys in production)
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

exports.initializePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum funding amount is ₦100'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate unique reference
    const reference = `FUND_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Create pending transaction
    const transaction = new Transaction({
      user: userId,
      type: 'credit',
      category: 'wallet_funding',
      amount,
      status: 'pending',
      reference,
      description: 'Wallet funding via Paystack'
    });
    await transaction.save();

    res.json({
      success: true,
      data: {
        reference,
        amount,
        email: user.email,
        // In production, initialize actual Paystack payment here
        authorizationUrl: `https://checkout.paystack.com/payment/${reference}`
      }
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment'
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user.userId;

    // Find the transaction
    const transaction = await Transaction.findOne({ reference, user: userId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: transaction
      });
    }

    // In production: Verify with Paystack API
    // const response = await axios.get(
    //   `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    //   { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    // );

    // For now, simulate successful verification
    const paymentSuccessful = true;

    if (paymentSuccessful) {
      // Update user wallet
      const user = await User.findById(userId);
      user.walletBalance += transaction.amount;
      await user.save();

      // Update transaction status
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await transaction.save();

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          transaction,
          newBalance: user.walletBalance
        }
      });
    } else {
      transaction.status = 'failed';
      await transaction.save();

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
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
        currentPage: page
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
