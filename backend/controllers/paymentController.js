const User = require('../models/User');
const Transaction = require('../models/Transaction');
const monnifyClient = require('../utils/monnifyClient');
const crypto = require('crypto');

exports.initializePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;

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

    const paymentReference = `FUND_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const transaction = new Transaction({
      user: userId,
      userId,
      type: 'credit',
      category: 'wallet_funding',
      amount: parseFloat(amount),
      status: 'pending',
      reference: paymentReference,
      paymentGateway: 'monnify',
      description: 'Wallet funding via Monnify',
      balanceBefore: user.walletBalance
    });
    await transaction.save();

    const monnifyPayload = {
      amount: parseFloat(amount),
      customerName: user.name,
      customerEmail: user.email,
      paymentReference,
      paymentDescription: `Wallet funding for ${user.email}`,
      redirectUrl: process.env.FRONTEND_URL || ''
    };

    const paymentResult = await monnifyClient.initializeTransaction(monnifyPayload);

    transaction.monnifyTransactionReference = paymentResult.data.transactionReference;
    transaction.monnifyPaymentReference = paymentResult.data.paymentReference;
    await transaction.save();

    res.json({
      success: true,
      data: {
        reference: paymentReference,
        amount: parseFloat(amount),
        checkoutUrl: paymentResult.data.checkoutUrl,
        transactionReference: paymentResult.data.transactionReference,
        paymentReference: paymentResult.data.paymentReference
      }
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize payment'
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.userId;

    const transaction = await Transaction.findOne({ 
      $or: [
        { reference },
        { monnifyTransactionReference: reference },
        { monnifyPaymentReference: reference }
      ],
      user: userId 
    });

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

    const monnifyRef = transaction.monnifyTransactionReference || reference;
    const verificationResult = await monnifyClient.verifyTransaction(monnifyRef);

    if (verificationResult.isPaid) {
      const paidAmount = verificationResult.amount;
      
      if (Math.abs(paidAmount - transaction.amount) > 0.01) {
        console.error(`Amount mismatch: expected ${transaction.amount}, got ${paidAmount}`);
        return res.status(400).json({
          success: false,
          message: 'Payment amount mismatch'
        });
      }

      const user = await User.findById(userId);
      const balanceBefore = user.walletBalance;
      user.walletBalance += paidAmount;
      await user.save();

      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.balanceBefore = balanceBefore;
      transaction.balanceAfter = user.walletBalance;
      transaction.amount = paidAmount;
      transaction.metadata = verificationResult.data;
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
      if (verificationResult.status === 'FAILED') {
        transaction.status = 'failed';
        await transaction.save();
      }

      res.status(400).json({
        success: false,
        message: 'Payment not completed',
        status: verificationResult.status
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
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

    const eventType = payload.eventType;
    const eventData = payload.eventData;

    console.log('Monnify webhook received:', eventType);

    if (eventType === 'SUCCESSFUL_TRANSACTION') {
      const { paymentReference, amountPaid, paidOn, transactionReference } = eventData;

      const transaction = await Transaction.findOne({ 
        $or: [
          { reference: paymentReference },
          { reference: transactionReference },
          { monnifyTransactionReference: transactionReference },
          { monnifyPaymentReference: paymentReference },
          { paymentReference: paymentReference }
        ]
      });

      if (!transaction) {
        console.log('Transaction not found for reference:', paymentReference);
        return res.status(200).json({ 
          success: true, 
          message: 'Transaction not found, but acknowledged' 
        });
      }

      if (transaction.status === 'completed') {
        return res.status(200).json({ 
          success: true, 
          message: 'Transaction already processed' 
        });
      }

      const user = await User.findById(transaction.user);
      if (!user) {
        console.error('User not found for transaction:', transaction._id);
        return res.status(200).json({ 
          success: true, 
          message: 'User not found, acknowledged' 
        });
      }

      if (Math.abs(amountPaid - transaction.amount) > 0.01) {
        console.error(`Webhook amount mismatch: expected ${transaction.amount}, got ${amountPaid}`);
        transaction.metadata = { ...eventData, amountMismatch: true };
        await transaction.save();
        return res.status(200).json({ 
          success: true, 
          message: 'Amount mismatch logged' 
        });
      }

      const balanceBefore = user.walletBalance;
      user.walletBalance += amountPaid;
      await user.save();

      transaction.status = 'completed';
      transaction.completedAt = new Date(paidOn);
      transaction.balanceBefore = balanceBefore;
      transaction.balanceAfter = user.walletBalance;
      transaction.amount = amountPaid;
      transaction.metadata = eventData;
      await transaction.save();

      console.log(`✅ Wallet credited: User ${user.email} - ₦${amountPaid}`);

      return res.status(200).json({ 
        success: true, 
        message: 'Webhook processed successfully' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Event acknowledged' 
    });
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

    const accountReference = `USER_${userId}_${Date.now()}`;

    const result = await monnifyClient.createReservedAccount({
      accountReference,
      accountName: user.name,
      customerEmail: user.email,
      customerName: user.name
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
