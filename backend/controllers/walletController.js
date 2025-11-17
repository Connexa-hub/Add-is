const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

exports.getWalletBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('walletBalance virtualAccountNumber name email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        balance: user.walletBalance || 0,
        virtualAccountNumber: user.virtualAccountNumber,
        currency: '₦',
        accountName: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.fundWallet = async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'card' } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const reference = `FUND-${uuidv4()}`;

    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'credit',
      category: 'wallet_funding',
      transactionType: 'Wallet Funding',
      amount,
      reference,
      status: 'completed',
      paymentGateway: 'manual',
      metadata: {
        paymentMethod,
        previousBalance: user.walletBalance,
        newBalance: user.walletBalance + amount
      }
    });

    user.walletBalance += amount;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Wallet funded successfully',
      data: {
        transaction: {
          id: transaction._id,
          reference,
          amount,
          newBalance: user.walletBalance,
          status: transaction.status,
          createdAt: transaction.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getWalletTransactions = async (req, res, next) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ 
      userId: req.userId,
      type: { $in: ['credit', 'debit'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Transaction.countDocuments({ 
      userId: req.userId,
      type: { $in: ['credit', 'debit'] }
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t._id,
          type: t.type,
          transactionType: t.transactionType,
          amount: t.amount,
          reference: t.reference,
          status: t.status,
          recipient: t.recipient,
          details: t.details,
          createdAt: t.createdAt
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
