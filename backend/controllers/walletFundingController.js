const User = require('../models/User');
const Card = require('../models/Card');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const monnifyClient = require('../utils/monnifyClient');
const { v4: uuidv4 } = require('uuid');

const initializeWalletFunding = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount, saveCard = false } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₦100'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const paymentReference = `WF-${Date.now()}-${uuidv4().slice(0, 8)}`;

    const transaction = await Transaction.create({
      user: userId,
      userId,
      type: 'credit',
      category: 'wallet_funding',
      transactionType: 'wallet_funding',
      amount: parseFloat(amount),
      balanceBefore: user.walletBalance,
      reference: paymentReference,
      paymentReference,
      paymentGateway: 'monnify',
      status: 'pending',
      description: 'Wallet funding via card payment',
      metadata: { saveCard }
    });

    const monnifyResponse = await monnifyClient.initializeTransaction({
      amount: parseFloat(amount),
      customerName: user.name,
      customerEmail: user.email,
      paymentReference,
      paymentDescription: 'Wallet Funding',
      redirectUrl: process.env.PAYMENT_REDIRECT_URL || 'https://app.example.com/payment/callback'
    });

    transaction.monnifyTransactionReference = monnifyResponse.data.transactionReference;
    transaction.monnifyPaymentReference = monnifyResponse.data.paymentReference;
    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Payment initialization successful',
      data: {
        transactionId: transaction._id,
        paymentReference,
        monnifyReference: monnifyResponse.data.transactionReference,
        checkoutUrl: monnifyResponse.data.checkoutUrl,
        amount: parseFloat(amount)
      }
    });
  } catch (error) {
    console.error('Initialize funding error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize payment',
      error: error.message
    });
  }
};

const verifyWalletFunding = async (req, res) => {
  try {
    const { paymentReference } = req.body;
    const userId = req.userId;

    if (!paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }

    const transaction = await Transaction.findOne({
      paymentReference,
      userId
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
        message: 'Transaction already completed',
        data: {
          status: 'completed',
          amount: transaction.amount,
          transactionId: transaction._id
        }
      });
    }

    const verification = await monnifyClient.verifyTransaction(transaction.monnifyTransactionReference || paymentReference);

    if (verification.isPaid) {
      const user = await User.findById(userId);
      
      user.walletBalance += transaction.amount;
      transaction.balanceAfter = user.walletBalance;
      transaction.status = 'completed';
      transaction.completedAt = new Date();

      await Promise.all([user.save(), transaction.save()]);

      await Notification.create({
        userId,
        title: 'Wallet Funded',
        message: `Your wallet has been credited with ₦${transaction.amount.toLocaleString()}`,
        type: 'success',
        actionType: 'wallet',
        actionData: { transactionId: transaction._id }
      });

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          status: 'completed',
          amount: transaction.amount,
          newBalance: user.walletBalance,
          transactionId: transaction._id
        }
      });
    } else {
      transaction.status = 'failed';
      await transaction.save();

      return res.status(400).json({
        success: false,
        message: 'Payment not confirmed',
        data: {
          status: verification.status,
          transactionId: transaction._id
        }
      });
    }
  } catch (error) {
    console.error('Verify funding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

const handleMonnifyWebhook = async (req, res) => {
  try {
    const signature = req.headers['monnify-signature'];
    const payload = req.body;

    if (!signature || !monnifyClient.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const { eventType, eventData } = payload;

    if (eventType === 'SUCCESSFUL_TRANSACTION') {
      const transaction = await Transaction.findOne({
        $or: [
          { monnifyTransactionReference: eventData.transactionReference },
          { monnifyPaymentReference: eventData.paymentReference },
          { paymentReference: eventData.paymentReference }
        ]
      });

      if (!transaction) {
        console.log('Transaction not found for webhook:', eventData.transactionReference);
        return res.json({ success: true, message: 'Transaction not found' });
      }

      if (transaction.status === 'completed') {
        return res.json({ success: true, message: 'Already processed' });
      }

      const user = await User.findById(transaction.userId);
      if (!user) {
        return res.json({ success: false, message: 'User not found' });
      }

      user.walletBalance += transaction.amount;
      transaction.balanceAfter = user.walletBalance;
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.metadata = {
        ...transaction.metadata,
        webhookData: eventData
      };

      await Promise.all([user.save(), transaction.save()]);

      await Notification.create({
        userId: user._id,
        title: 'Wallet Funded',
        message: `Your wallet has been credited with ₦${transaction.amount.toLocaleString()}`,
        type: 'success',
        actionType: 'wallet',
        actionData: { transactionId: transaction._id }
      });

      console.log(`Wallet funding completed via webhook: ${transaction._id}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

const saveCardAfterPayment = async (req, res) => {
  try {
    const userId = req.userId;
    const { paymentReference, cardDetails } = req.body;

    if (!paymentReference || !cardDetails) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference and card details are required'
      });
    }

    const transaction = await Transaction.findOne({
      paymentReference,
      userId,
      status: 'completed'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Completed transaction not found'
      });
    }

    const { cardToken, last4, brand, expiryMonth, expiryYear, cardholderName, bin } = cardDetails;

    if (!cardToken || !last4 || !brand || !expiryMonth || !expiryYear) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete card details'
      });
    }

    const existingCard = await Card.findOne({ cardToken });
    if (existingCard) {
      return res.json({
        success: true,
        message: 'Card already saved',
        data: {
          cardId: existingCard._id,
          last4: existingCard.last4
        }
      });
    }

    const userCards = await Card.countDocuments({ userId, isActive: true });
    const isFirstCard = userCards === 0;

    const card = await Card.create({
      userId,
      cardToken,
      last4,
      brand: brand.toLowerCase(),
      expiryMonth,
      expiryYear,
      cardholderName,
      bin,
      isDefault: isFirstCard,
      isActive: true,
      monnifyCardReference: transaction.monnifyTransactionReference
    });

    await User.findByIdAndUpdate(userId, {
      $push: { savedCards: card._id }
    });

    res.json({
      success: true,
      message: 'Card saved successfully',
      data: {
        cardId: card._id,
        last4: card.last4,
        brand: card.brand,
        isDefault: card.isDefault
      }
    });
  } catch (error) {
    console.error('Save card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save card',
      error: error.message
    });
  }
};

const chargeCard = async (req, res) => {
  try {
    const userId = req.userId;
    const { cardId, amount } = req.body;

    if (!cardId || !amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Card ID and amount (min ₦100) are required'
      });
    }

    const card = await Card.findOne({ _id: cardId, userId, isActive: true });
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    res.json({
      success: true,
      message: 'Card charging not fully implemented - use Monnify SDK for recurring charges',
      data: {
        cardId: card._id,
        last4: card.last4,
        note: 'Implement Monnify card charging API when available'
      }
    });
  } catch (error) {
    console.error('Charge card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to charge card',
      error: error.message
    });
  }
};

module.exports = {
  initializeWalletFunding,
  verifyWalletFunding,
  handleMonnifyWebhook,
  saveCardAfterPayment,
  chargeCard
};
