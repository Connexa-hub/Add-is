const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { requestVTPass } = require('../utils/vtpassClient');
const { v4: uuidv4 } = require('uuid');
const { createTransactionNotification, createCashbackNotification } = require('../utils/notificationHelper');

exports.payElectricity = async (req, res, next) => {
  try {
    const { meterNumber, variation_code, serviceID, amount, usedCashback = 0 } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (usedCashback > 0 && user.cashbackBalance < usedCashback) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient cashback balance. Available: ₦${user.cashbackBalance}` 
      });
    }

    const finalAmount = amount - usedCashback;

    if (user.walletBalance < finalAmount) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient wallet balance. Required: ₦${finalAmount}, Available: ₦${user.walletBalance}` 
      });
    }

    const reference = `ELEC-${uuidv4()}`;
    const balanceBefore = user.walletBalance;
    const cashbackBalanceBefore = user.cashbackBalance;

    const result = await requestVTPass(serviceID, {
      billersCode: meterNumber,
      variation_code,
      amount,
      phone: '08011111111',
      request_id: reference
    });

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

    if (result.code === '000') {
      user.walletBalance -= finalAmount;
      user.cashbackBalance -= usedCashback;
      
      if (cashbackAmount > 0) {
        user.cashbackBalance += cashbackAmount;
      }

      await user.save();
    }

    const transaction = await Transaction.create({ 
      userId: req.userId, 
      type: 'debit',
      category: 'electricity', 
      transactionType: 'Electricity Payment', 
      amount, 
      reference,
      recipient: meterNumber,
      status: result.code === '000' ? 'completed' : 'failed',
      paymentGateway: 'vtpass', 
      balanceBefore,
      balanceAfter: user.walletBalance,
      details: result,
      metadata: { 
        cashbackUsed: usedCashback,
        cashbackEarned: cashbackAmount,
        netDebit: finalAmount,
        cashbackBalanceBefore,
        cashbackBalanceAfter: user.cashbackBalance
      }
    });

    if (result.code === '000') {
      await createTransactionNotification(req.userId, transaction, 'success', {
        newBalance: user.walletBalance,
        cashbackEarned: cashbackAmount,
        cashbackUsed: usedCashback
      });

      if (cashbackAmount > 0) {
        await createCashbackNotification(req.userId, cashbackAmount, reference);
      }
    } else {
      await createTransactionNotification(req.userId, transaction, 'failed', {
        errorMessage: result.response_description || 'Transaction failed',
        errorDetails: result
      });
    }

    res.json({ 
      success: result.code === '000',
      message: result.code === '000' ? 'Electricity payment successful' : 'Electricity payment failed',
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
        newBalance: user.walletBalance,
        newCashbackBalance: user.cashbackBalance
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.subscribeTV = async (req, res, next) => {
  try {
    const { smartcardNumber, variation_code, serviceID, amount, usedCashback = 0 } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (usedCashback > 0 && user.cashbackBalance < usedCashback) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient cashback balance. Available: ₦${user.cashbackBalance}` 
      });
    }

    const finalAmount = amount - usedCashback;

    if (user.walletBalance < finalAmount) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient wallet balance. Required: ₦${finalAmount}, Available: ₦${user.walletBalance}` 
      });
    }

    const reference = `TV-${uuidv4()}`;
    const balanceBefore = user.walletBalance;
    const cashbackBalanceBefore = user.cashbackBalance;

    const result = await requestVTPass(serviceID, {
      billersCode: smartcardNumber,
      variation_code,
      phone: '08011111111',
      request_id: reference
    });

    const Cashback = require('../models/Cashback');
    const cashbackConfig = await Cashback.findOne({ 
      serviceType: 'TV',
      isActive: true 
    });

    let cashbackAmount = 0;
    if (cashbackConfig && result.code === '000' && amount >= cashbackConfig.minAmount) {
      cashbackAmount = (amount * cashbackConfig.percentage) / 100;
      if (cashbackConfig.maxCashback && cashbackAmount > cashbackConfig.maxCashback) {
        cashbackAmount = cashbackConfig.maxCashback;
      }
    }

    if (result.code === '000') {
      user.walletBalance -= finalAmount;
      user.cashbackBalance -= usedCashback;
      
      if (cashbackAmount > 0) {
        user.cashbackBalance += cashbackAmount;
      }

      await user.save();
    }

    const transaction = await Transaction.create({ 
      userId: req.userId, 
      type: 'debit',
      category: 'tv', 
      transactionType: 'TV Subscription', 
      amount, 
      reference,
      recipient: smartcardNumber,
      status: result.code === '000' ? 'completed' : 'failed',
      paymentGateway: 'vtpass',
      balanceBefore,
      balanceAfter: user.walletBalance,
      details: result,
      metadata: { 
        cashbackUsed: usedCashback,
        cashbackEarned: cashbackAmount,
        netDebit: finalAmount,
        cashbackBalanceBefore,
        cashbackBalanceAfter: user.cashbackBalance
      }
    });

    if (result.code === '000') {
      await createTransactionNotification(req.userId, transaction, 'success', {
        newBalance: user.walletBalance,
        cashbackEarned: cashbackAmount,
        cashbackUsed: usedCashback
      });

      if (cashbackAmount > 0) {
        await createCashbackNotification(req.userId, cashbackAmount, reference);
      }
    } else {
      await createTransactionNotification(req.userId, transaction, 'failed', {
        errorMessage: result.response_description || 'Transaction failed',
        errorDetails: result
      });
    }

    res.json({ 
      success: result.code === '000',
      message: result.code === '000' ? 'TV subscription successful' : 'TV subscription failed',
      data: {
        transaction: {
          id: transaction._id,
          reference,
          amount: transaction.amount,
          status: transaction.status,
          recipient: smartcardNumber,
          details: result
        },
        newBalance: user.walletBalance,
        newCashbackBalance: user.cashbackBalance
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getDataPlans = async (req, res) => {
  try {
    const { serviceID } = req.params;

    const axios = require('axios');
    const getAuthHeaders = () => {
      const token = Buffer.from(`${process.env.VTPASS_USERNAME}:${process.env.VTPASS_API_KEY}`).toString('base64');
      return {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json'
      };
    };

    const response = await axios.get(
      `${process.env.VTPASS_BASE_URL}/service-variations?serviceID=${serviceID}`,
      { headers: getAuthHeaders() }
    );

    if (response.data && response.data.content && response.data.content.variations) {
      res.json({
        success: true,
        data: response.data.content.variations
      });
    } else {
      res.json({
        success: false,
        message: 'No plans available'
      });
    }
  } catch (error) {
    console.error('Get data plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data plans'
    });
  }
};

exports.buyAirtime = async (req, res) => {
  try {
    const { phoneNumber, network, amount, usedCashback = 0 } = req.body;
    const userId = req.userId;

    if (!phoneNumber || !network || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const phoneRegex = /^0[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (usedCashback > 0 && user.cashbackBalance < usedCashback) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient cashback balance. Available: ₦${user.cashbackBalance}` 
      });
    }

    const finalAmount = amount - usedCashback;

    if (user.walletBalance < finalAmount) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient wallet balance. Required: ₦${finalAmount}, Available: ₦${user.walletBalance}` 
      });
    }

    const balanceBefore = user.walletBalance;
    const cashbackBalanceBefore = user.cashbackBalance;

    let vtpassResponse;
    try {
      vtpassResponse = await requestVTPass(network, {
        phone: phoneNumber,
        amount,
      });
    } catch (vtpassError) {
      console.error('VTPass API error:', vtpassError);
      return res.status(500).json({ 
        message: 'Failed to process purchase with service provider. Please try again.' 
      });
    }

    const isSuccess = vtpassResponse && (vtpassResponse.code === '000' || vtpassResponse.content?.transactions?.status === 'delivered');

    const Cashback = require('../models/Cashback');
    const cashbackConfig = await Cashback.findOne({ 
      serviceType: 'Airtime',
      isActive: true 
    });

    let cashbackAmount = 0;
    if (cashbackConfig && isSuccess && amount >= cashbackConfig.minAmount) {
      cashbackAmount = (amount * cashbackConfig.percentage) / 100;
      if (cashbackConfig.maxCashback && cashbackAmount > cashbackConfig.maxCashback) {
        cashbackAmount = cashbackConfig.maxCashback;
      }
    }

    if (isSuccess) {
      user.walletBalance -= finalAmount;
      user.cashbackBalance -= usedCashback;
      
      if (cashbackAmount > 0) {
        user.cashbackBalance += cashbackAmount;
      }

      await user.save();
    }

    const transaction = new Transaction({
      userId,
      type: 'debit',
      category: 'airtime',
      transactionType: `${network.toUpperCase()} Airtime Purchase`,
      amount,
      recipient: phoneNumber,
      status: isSuccess ? 'completed' : 'failed',
      reference: vtpassResponse?.requestId || `AIRTIME-${Date.now()}`,
      paymentGateway: 'vtpass',
      balanceBefore,
      balanceAfter: user.walletBalance,
      metadata: {
        network,
        phoneNumber,
        vtpassResponse,
        cashbackUsed: usedCashback,
        cashbackEarned: cashbackAmount,
        netDebit: finalAmount,
        cashbackBalanceBefore,
        cashbackBalanceAfter: user.cashbackBalance
      }
    });

    await transaction.save();

    if (isSuccess) {
      await createTransactionNotification(userId, transaction, 'success', {
        newBalance: user.walletBalance,
        cashbackEarned: cashbackAmount,
        cashbackUsed: usedCashback
      });

      if (cashbackAmount > 0) {
        await createCashbackNotification(userId, cashbackAmount, transaction.reference);
      }
    } else {
      await createTransactionNotification(userId, transaction, 'failed', {
        errorMessage: vtpassResponse?.response_description || 'Transaction failed',
        errorDetails: vtpassResponse
      });

      return res.status(400).json({
        success: false,
        message: vtpassResponse?.response_description || 'Transaction failed',
        transaction,
      });
    }

    res.json({
      success: true,
      message: 'Airtime purchase successful',
      transaction,
      newBalance: user.walletBalance,
      newCashbackBalance: user.cashbackBalance,
      vtpassResponse,
    });
  } catch (error) {
    console.error('Buy airtime error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

exports.buyData = async (req, res) => {
  try {
    const { phoneNumber, plan, network, amount, usedCashback = 0 } = req.body;
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

    if (usedCashback > 0 && user.cashbackBalance < usedCashback) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient cashback balance. Available: ₦${user.cashbackBalance}` 
      });
    }

    const finalAmount = amount - usedCashback;

    if (user.walletBalance < finalAmount) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient wallet balance. Required: ₦${finalAmount}, Available: ₦${user.walletBalance}` 
      });
    }

    const balanceBefore = user.walletBalance;
    const cashbackBalanceBefore = user.cashbackBalance;

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

    const Cashback = require('../models/Cashback');
    const cashbackConfig = await Cashback.findOne({ 
      serviceType: 'Data',
      isActive: true 
    });

    let cashbackAmount = 0;
    if (cashbackConfig && isSuccess && amount >= cashbackConfig.minAmount) {
      cashbackAmount = (amount * cashbackConfig.percentage) / 100;
      if (cashbackConfig.maxCashback && cashbackAmount > cashbackConfig.maxCashback) {
        cashbackAmount = cashbackConfig.maxCashback;
      }
    }

    if (isSuccess) {
      user.walletBalance -= finalAmount;
      user.cashbackBalance -= usedCashback;
      
      if (cashbackAmount > 0) {
        user.cashbackBalance += cashbackAmount;
      }

      await user.save();
    }

    const transaction = new Transaction({
      userId,
      type: 'debit',
      category: 'data',
      transactionType: `${network.toUpperCase()} Data Purchase`,
      amount,
      recipient: phoneNumber,
      status: isSuccess ? 'completed' : 'failed',
      reference: vtpassResponse?.requestId || `DATA-${Date.now()}`,
      paymentGateway: 'vtpass',
      balanceBefore,
      balanceAfter: user.walletBalance,
      metadata: {
        network,
        plan,
        phoneNumber,
        vtpassResponse,
        cashbackUsed: usedCashback,
        cashbackEarned: cashbackAmount,
        netDebit: finalAmount,
        cashbackBalanceBefore,
        cashbackBalanceAfter: user.cashbackBalance
      }
    });

    await transaction.save();

    if (isSuccess) {
      await createTransactionNotification(userId, transaction, 'success', {
        newBalance: user.walletBalance,
        cashbackEarned: cashbackAmount,
        cashbackUsed: usedCashback
      });

      if (cashbackAmount > 0) {
        await createCashbackNotification(userId, cashbackAmount, transaction.reference);
      }
    } else {
      await createTransactionNotification(userId, transaction, 'failed', {
        errorMessage: vtpassResponse?.response_description || 'Transaction failed',
        errorDetails: vtpassResponse
      });

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
      newCashbackBalance: user.cashbackBalance,
      vtpassResponse,
    });
  } catch (error) {
    console.error('Buy data error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

exports.buyEducation = async (req, res, next) => {
  try {
    const { serviceID, variation_code, amount, billersCode, phone, usedCashback = 0 } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (usedCashback > 0 && user.cashbackBalance < usedCashback) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient cashback balance. Available: ₦${user.cashbackBalance}` 
      });
    }

    const finalAmount = amount - usedCashback;

    if (user.walletBalance < finalAmount) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient wallet balance. Required: ₦${finalAmount}, Available: ₦${user.walletBalance}` 
      });
    }

    const reference = `EDU-${uuidv4()}`;
    const balanceBefore = user.walletBalance;
    const cashbackBalanceBefore = user.cashbackBalance;

    const result = await requestVTPass(serviceID, {
      billersCode: billersCode || phone,
      variation_code,
      amount,
      phone: phone || '08011111111',
      request_id: reference
    });

    const Cashback = require('../models/Cashback');
    const cashbackConfig = await Cashback.findOne({ 
      serviceType: 'Education', 
      isActive: true 
    });

    let cashbackAmount = 0;
    if (cashbackConfig && result.code === '000' && amount >= cashbackConfig.minAmount) {
      cashbackAmount = (amount * cashbackConfig.percentage) / 100;
      if (cashbackConfig.maxCashback && cashbackAmount > cashbackConfig.maxCashback) {
        cashbackAmount = cashbackConfig.maxCashback;
      }
    }

    if (result.code === '000') {
      user.walletBalance -= finalAmount;
      user.cashbackBalance -= usedCashback;

      if (cashbackAmount > 0) {
        user.cashbackBalance += cashbackAmount;
      }

      await user.save();
    }

    const transaction = await Transaction.create({ 
      userId: req.userId, 
      type: 'debit',
      category: 'education',
      transactionType: 'Education Service', 
      amount, 
      reference,
      recipient: billersCode || phone,
      status: result.code === '000' ? 'completed' : 'failed',
      paymentGateway: 'vtpass',
      balanceBefore,
      balanceAfter: user.walletBalance,
      details: result,
      metadata: { 
        cashbackUsed: usedCashback,
        cashbackEarned: cashbackAmount,
        netDebit: finalAmount,
        cashbackBalanceBefore,
        cashbackBalanceAfter: user.cashbackBalance
      }
    });

    if (result.code === '000') {
      await createTransactionNotification(req.userId, transaction, 'success', {
        newBalance: user.walletBalance,
        cashbackEarned: cashbackAmount,
        cashbackUsed: usedCashback
      });

      if (cashbackAmount > 0) {
        await createCashbackNotification(req.userId, cashbackAmount, reference);
      }
    } else {
      await createTransactionNotification(req.userId, transaction, 'failed', {
        errorMessage: result.response_description || 'Transaction failed',
        errorDetails: result
      });
    }

    res.json({ 
      success: result.code === '000',
      message: result.code === '000' ? 'Education service purchase successful' : 'Education service purchase failed',
      data: {
        transaction: {
          id: transaction._id,
          reference,
          amount: transaction.amount,
          status: transaction.status,
          recipient: billersCode || phone,
          details: result
        },
        newBalance: user.walletBalance,
        newCashbackBalance: user.cashbackBalance
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.buyInsurance = async (req, res, next) => {
  try {
    const { serviceID, variation_code, amount, billersCode, phone, usedCashback = 0 } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (usedCashback > 0 && user.cashbackBalance < usedCashback) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient cashback balance. Available: ₦${user.cashbackBalance}` 
      });
    }

    const finalAmount = amount - usedCashback;

    if (user.walletBalance < finalAmount) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient wallet balance. Required: ₦${finalAmount}, Available: ₦${user.walletBalance}` 
      });
    }

    const reference = `INS-${uuidv4()}`;
    const balanceBefore = user.walletBalance;
    const cashbackBalanceBefore = user.cashbackBalance;

    const result = await requestVTPass(serviceID, {
      billersCode: billersCode || phone,
      variation_code,
      amount,
      phone: phone || '08011111111',
      request_id: reference
    });

    const Cashback = require('../models/Cashback');
    const cashbackConfig = await Cashback.findOne({ 
      serviceType: 'Insurance', 
      isActive: true 
    });

    let cashbackAmount = 0;
    if (cashbackConfig && result.code === '000' && amount >= cashbackConfig.minAmount) {
      cashbackAmount = (amount * cashbackConfig.percentage) / 100;
      if (cashbackConfig.maxCashback && cashbackAmount > cashbackConfig.maxCashback) {
        cashbackAmount = cashbackConfig.maxCashback;
      }
    }

    if (result.code === '000') {
      user.walletBalance -= finalAmount;
      user.cashbackBalance -= usedCashback;

      if (cashbackAmount > 0) {
        user.cashbackBalance += cashbackAmount;
      }

      await user.save();
    }

    const transaction = await Transaction.create({ 
      userId: req.userId, 
      type: 'debit',
      category: 'insurance',
      transactionType: 'Insurance Payment', 
      amount, 
      reference,
      recipient: billersCode || phone,
      status: result.code === '000' ? 'completed' : 'failed',
      paymentGateway: 'vtpass',
      balanceBefore,
      balanceAfter: user.walletBalance,
      details: result,
      metadata: { 
        cashbackUsed: usedCashback,
        cashbackEarned: cashbackAmount,
        netDebit: finalAmount,
        cashbackBalanceBefore,
        cashbackBalanceAfter: user.cashbackBalance
      }
    });

    if (result.code === '000') {
      await createTransactionNotification(req.userId, transaction, 'success', {
        newBalance: user.walletBalance,
        cashbackEarned: cashbackAmount,
        cashbackUsed: usedCashback
      });

      if (cashbackAmount > 0) {
        await createCashbackNotification(req.userId, cashbackAmount, reference);
      }
    } else {
      await createTransactionNotification(req.userId, transaction, 'failed', {
        errorMessage: result.response_description || 'Transaction failed',
        errorDetails: result
      });
    }

    res.json({ 
      success: result.code === '000',
      message: result.code === '000' ? 'Insurance purchase successful' : 'Insurance purchase failed',
      data: {
        transaction: {
          id: transaction._id,
          reference,
          amount: transaction.amount,
          status: transaction.status,
          recipient: billersCode || phone,
          details: result
        },
        newBalance: user.walletBalance,
        newCashbackBalance: user.cashbackBalance
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.buyOtherService = async (req, res, next) => {
  try {
    const { serviceID, variation_code, amount, billersCode, phone, usedCashback = 0 } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (usedCashback > 0 && user.cashbackBalance < usedCashback) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient cashback balance. Available: ₦${user.cashbackBalance}` 
      });
    }

    const finalAmount = amount - usedCashback;

    if (user.walletBalance < finalAmount) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient wallet balance. Required: ₦${finalAmount}, Available: ₦${user.walletBalance}` 
      });
    }

    const reference = `SVC-${uuidv4()}`;
    const balanceBefore = user.walletBalance;
    const cashbackBalanceBefore = user.cashbackBalance;

    const result = await requestVTPass(serviceID, {
      billersCode: billersCode || phone,
      variation_code,
      amount,
      phone: phone || '08011111111',
      request_id: reference
    });

    let category = 'internet';
    if (serviceID && serviceID.toLowerCase().includes('bet')) {
      category = 'betting';
    }

    const Cashback = require('../models/Cashback');
    const cashbackConfig = await Cashback.findOne({ 
      serviceType: category === 'betting' ? 'Betting' : 'Internet', 
      isActive: true 
    });

    let cashbackAmount = 0;
    if (cashbackConfig && result.code === '000' && amount >= cashbackConfig.minAmount) {
      cashbackAmount = (amount * cashbackConfig.percentage) / 100;
      if (cashbackConfig.maxCashback && cashbackAmount > cashbackConfig.maxCashback) {
        cashbackAmount = cashbackConfig.maxCashback;
      }
    }

    if (result.code === '000') {
      user.walletBalance -= finalAmount;
      user.cashbackBalance -= usedCashback;

      if (cashbackAmount > 0) {
        user.cashbackBalance += cashbackAmount;
      }

      await user.save();
    }

    const transaction = await Transaction.create({ 
      userId: req.userId, 
      type: 'debit',
      category,
      transactionType: category === 'betting' ? 'Betting Service' : 'Internet Service', 
      amount, 
      reference,
      recipient: billersCode || phone,
      status: result.code === '000' ? 'completed' : 'failed',
      paymentGateway: 'vtpass',
      balanceBefore,
      balanceAfter: user.walletBalance,
      details: result,
      metadata: { 
        cashbackUsed: usedCashback,
        cashbackEarned: cashbackAmount,
        netDebit: finalAmount,
        cashbackBalanceBefore,
        cashbackBalanceAfter: user.cashbackBalance,
        serviceID 
      }
    });

    if (result.code === '000') {
      await createTransactionNotification(req.userId, transaction, 'success', {
        newBalance: user.walletBalance,
        cashbackEarned: cashbackAmount,
        cashbackUsed: usedCashback
      });

      if (cashbackAmount > 0) {
        await createCashbackNotification(req.userId, cashbackAmount, reference);
      }
    } else {
      await createTransactionNotification(req.userId, transaction, 'failed', {
        errorMessage: result.response_description || 'Transaction failed',
        errorDetails: result
      });
    }

    res.json({ 
      success: result.code === '000',
      message: result.code === '000' ? 'Service purchase successful' : 'Service purchase failed',
      data: {
        transaction: {
          id: transaction._id,
          reference,
          amount: transaction.amount,
          status: transaction.status,
          recipient: billersCode || phone,
          details: result
        },
        newBalance: user.walletBalance,
        newCashbackBalance: user.cashbackBalance
      }
    });
  } catch (err) {
    next(err);
  }
};