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

// REMOVED (2026-07-15, Phase 1 security fix): this endpoint used to credit
// user.walletBalance directly from client-supplied `amount` with zero payment
// verification — any authenticated user could mint arbitrary funds into their
// own wallet. Wallet crediting must ONLY ever happen after a payment provider
// confirms funds were actually received. That flow already exists correctly
// at POST /api/wallet/funding/initialize -> /verify, and via the signature-
// verified webhook at POST /api/wallet/funding/webhook
// (see backend/controllers/walletFundingController.js). Use those instead.
//
// This export is kept as a stub that always fails closed, so any client still
// pointed at the old route gets a clear error instead of silently succeeding
// or 404ing in a way that looks like a transient bug.
exports.fundWallet = async (_req, res) => {
  return res.status(410).json({
    success: false,
    message:
      'This endpoint has been removed for security reasons. Use POST /api/wallet/funding/initialize ' +
      'to start a verified payment, then /api/wallet/funding/verify or the provider webhook to complete it.'
  });
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
