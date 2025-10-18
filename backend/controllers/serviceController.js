const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { requestVTPass } = require('../utils/vtpassClient');
const { v4: uuidv4 } = require('uuid');

exports.subscribeTV = async (req, res, next) => {
  try {
    const { smartcardNumber, variation_code, serviceID, amount } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.walletBalance < (amount || 0)) {
      return res.status(400).json({ 
        success: false,
        message: 'Insufficient wallet balance' 
      });
    }

    const reference = `TV-${uuidv4()}`;
    
    const result = await requestVTPass(serviceID, {
      billersCode: smartcardNumber,
      variation_code,
      phone: '08011111111',
      request_id: reference
    });

    const transaction = await Transaction.create({ 
      userId: req.userId, 
      type: 'TV Subscription', 
      transactionType: 'debit', 
      amount: amount || 0, 
      reference,
      recipient: smartcardNumber,
      status: result.code === '000' ? 'success' : 'failed', 
      details: result 
    });

    if (result.code === '000' && amount) {
      user.walletBalance -= amount;
      await user.save();
    }

    res.json({ 
      success: true,
      message: 'TV subscription successful',
      data: {
        transaction: {
          id: transaction._id,
          reference,
          amount: transaction.amount,
          status: transaction.status,
          recipient: smartcardNumber,
          details: result
        },
        newBalance: user.walletBalance
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.buyData = async (req, res, next) => {
  try {
    const { phoneNumber, variation_code, serviceID, amount } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.walletBalance < (amount || 0)) {
      return res.status(400).json({ 
        success: false,
        message: 'Insufficient wallet balance' 
      });
    }

    const reference = `DATA-${uuidv4()}`;

    const result = await requestVTPass(serviceID, {
      phone: phoneNumber,
      variation_code,
      billersCode: phoneNumber,
      request_id: reference
    });

    const transaction = await Transaction.create({ 
      userId: req.userId, 
      type: 'Data Purchase', 
      transactionType: 'debit', 
      amount: amount || 0, 
      reference,
      recipient: phoneNumber,
      status: result.code === '000' ? 'success' : 'failed', 
      details: result 
    });

    if (result.code === '000' && amount) {
      user.walletBalance -= amount;
      await user.save();
    }

    res.json({ 
      success: true,
      message: 'Data purchase successful',
      data: {
        transaction: {
          id: transaction._id,
          reference,
          amount: transaction.amount,
          status: transaction.status,
          recipient: phoneNumber,
          details: result
        },
        newBalance: user.walletBalance
      }
    });
  } catch (err) {
    next(err);
  }
};
