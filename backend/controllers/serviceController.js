
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { requestVTPass } = require('../utils/vtpassClient');
const { v4: uuidv4 } = require('uuid');

exports.payElectricity = async (req, res, next) => {
  try {
    const { meterNumber, variation_code, serviceID, amount } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Insufficient wallet balance' 
      });
    }

    const reference = `ELEC-${uuidv4()}`;

    const result = await requestVTPass(serviceID, {
      billersCode: meterNumber,
      variation_code,
      amount,
      phone: '08011111111',
      request_id: reference
    });

    // Calculate cashback
    const Cashback = require('../models/Cashback');
    const cashbackConfig = await Cashback.findOne({ 
      serviceType: 'Electricity', 
      isActive: true 
    });
    
    let cashbackAmount = 0;
    if (cashbackConfig && result.code === '000' && amount >= cashbackConfig.minAmount) {
      cashbackAmount = (amount * cashbackConfig.percentage) / 100;
      if (cashbackConfig.maxCashback && cashbackAmount > cashbackConfig.maxCashback) {
        cashbackAmount = cashbackConfig.maxCashback;
      }
    }

    const transaction = await Transaction.create({ 
      userId: req.userId, 
      type: 'Electricity', 
      transactionType: 'debit', 
      amount, 
      reference,
      recipient: meterNumber,
      status: result.code === '000' ? 'success' : 'failed', 
      details: result,
      cashbackAmount
    });

    if (result.code === '000') {
      user.walletBalance -= amount;
      
      // Add cashback to wallet
      if (cashbackAmount > 0) {
        user.walletBalance += cashbackAmount;
        
        // Create notification for cashback
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: req.userId,
          title: 'Cashback Earned!',
          message: `You've earned ₦${cashbackAmount.toFixed(2)} cashback on your electricity payment`,
          type: 'cashback'
        });
      }
      
      await user.save();
    }

    res.json({ 
      success: true,
      message: 'Electricity payment successful',
      data: {
        transaction: {
          id: transaction._id,
          reference,
          amount: transaction.amount,
          status: transaction.status,
          recipient: meterNumber,
          token: result.content?.token || 'Token sent to meter',
          details: result
        },
        newBalance: user.walletBalance
      }
    });
  } catch (err) {
    next(err);
  }
};

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

exports.buyData = async (req, res) => {
  try {
    const { phoneNumber, plan, network, amount } = req.body;
    const userId = req.userId;

    if (!phoneNumber || !plan || !network || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ 
        message: `Insufficient balance. Required: ₦${amount}, Available: ₦${user.walletBalance}` 
      });
    }

    let vtpassResponse;
    try {
      vtpassResponse = await requestVTPass(network, {
        billersCode: phoneNumber,
        variation_code: plan,
        amount,
        phone: phoneNumber,
      });
    } catch (vtpassError) {
      console.error('VTPass API error:', vtpassError);
      return res.status(500).json({ 
        message: 'Failed to process purchase with service provider. Please try again.' 
      });
    }

    const isSuccess = vtpassResponse && (vtpassResponse.code === '000' || vtpassResponse.content?.transactions?.status === 'delivered');

    if (isSuccess) {
      user.walletBalance -= amount;
      await user.save();
    }

    const transaction = new Transaction({
      userId,
      type: 'data',
      transactionType: `${network.toUpperCase()} Data Purchase`,
      amount,
      recipient: phoneNumber,
      status: isSuccess ? 'success' : 'failed',
      reference: vtpassResponse?.requestId || `REF${Date.now()}`,
      metadata: {
        network,
        plan,
        phoneNumber,
        vtpassResponse,
      }
    });

    await transaction.save();

    if (!isSuccess) {
      return res.status(400).json({
        success: false,
        message: vtpassResponse?.response_description || 'Transaction failed',
        transaction,
      });
    }

    res.json({
      success: true,
      message: 'Data purchase successful',
      transaction,
      newBalance: user.walletBalance,
      vtpassResponse,
    });
  } catch (error) {
    console.error('Buy data error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
