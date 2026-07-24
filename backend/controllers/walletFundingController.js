const Card = require('../models/Card');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const monnifyClient = require('../utils/monnifyClient');
const {
  FundingError,
  coreInitializeFunding,
  coreVerifyFunding,
  coreProcessMonnifyWebhook
} = require('../utils/walletFundingCore');

// Thin Express-handler wrapper around the shared funding core (see
// backend/utils/walletFundingCore.js — this used to be a full, independent
// duplicate of paymentController.js's funding logic; consolidated in Phase 3).

const initializeWalletFunding = async (req, res) => {
  try {
    const { amount } = req.body;
    const { transaction, monnifyData } = await coreInitializeFunding(req.userId, amount);

    res.status(201).json({
      success: true,
      message: 'Payment initialization successful',
      data: {
        transactionId: transaction._id,
        paymentReference: transaction.paymentReference,
        monnifyReference: transaction.monnifyTransactionReference,
        checkoutUrl: monnifyData.checkoutUrl,
        amount: transaction.amount
      }
    });
  } catch (error) {
    console.error('Initialize funding error:', error);
    const statusCode = error instanceof FundingError ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to initialize payment'
    });
  }
};

const verifyWalletFunding = async (req, res) => {
  try {
    const { paymentReference } = req.body;
    if (!paymentReference) {
      return res.status(400).json({ success: false, message: 'Payment reference is required' });
    }

    const result = await coreVerifyFunding(req.userId, paymentReference);

    if (result.status === 'completed') {
      return res.json({
        success: true,
        message: result.alreadyProcessed ? 'Transaction already completed' : 'Payment verified successfully',
        data: {
          status: 'completed',
          amount: result.transaction.amount,
          newBalance: result.newBalance,
          transactionId: result.transaction._id,
          cardData: result.cardData
        }
      });
    }

    return res.json({
      success: false,
      message: result.isPending ? 'Payment is being processed' : 'Payment not confirmed',
      data: {
        status: result.status,
        transactionId: result.transaction._id,
        isPending: result.isPending
      }
    });
  } catch (error) {
    console.error('Verify funding error:', error);
    const statusCode = error instanceof FundingError ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to verify payment'
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

    const result = await coreProcessMonnifyWebhook(payload.eventType, payload.eventData);
    res.json({ success: true, message: result.message });
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
    const { cardId } = req.body;

    if (!cardId || !req.body.amount || req.body.amount < 100) {
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

    // NOT IMPLEMENTED: recurring/saved-card charging requires Monnify's
    // tokenized card charge API, which this integration doesn't call yet.
    // Flagged explicitly (see ROADMAP.md Phase 3) rather than silently
    // returning success — this must not be mistaken for a working feature.
    res.status(501).json({
      success: false,
      message: 'Charging a saved card is not implemented yet. Use the standard funding flow (checkout URL) instead.',
      data: {
        cardId: card._id,
        last4: card.last4
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
