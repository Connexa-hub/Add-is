const Card = require('../models/Card');
const User = require('../models/User');

const saveCard = async (req, res) => {
  try {
    const userId = req.userId;
    const { cardToken, last4, brand, expiryMonth, expiryYear, cardholderName, monnifyCardReference, bin, isDefault } = req.body;

    if (!cardToken || !last4 || !brand || !expiryMonth || !expiryYear) {
      return res.status(400).json({
        success: false,
        message: 'Missing required card fields'
      });
    }

    const existingCard = await Card.findOne({ cardToken });
    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'This card is already saved'
      });
    }

    if (isDefault) {
      await Card.updateMany(
        { userId, isActive: true },
        { $set: { isDefault: false } }
      );
    }

    const card = await Card.create({
      userId,
      cardToken,
      last4,
      brand: brand.toLowerCase(),
      expiryMonth,
      expiryYear,
      cardholderName,
      monnifyCardReference,
      bin,
      isDefault: isDefault || false,
      isActive: true
    });

    await User.findByIdAndUpdate(userId, {
      $push: { savedCards: card._id }
    });

    res.status(201).json({
      success: true,
      message: 'Card saved successfully',
      data: {
        cardId: card._id,
        last4: card.last4,
        brand: card.brand,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
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

const getUserCards = async (req, res) => {
  try {
    const userId = req.userId;

    const cards = await Card.find({ userId, isActive: true })
      .select('-cardToken -monnifyCardReference')
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: cards.map(card => ({
        cardId: card._id,
        last4: card.last4,
        brand: card.brand,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        cardholderName: card.cardholderName,
        isDefault: card.isDefault,
        createdAt: card.createdAt
      }))
    });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cards',
      error: error.message
    });
  }
};

const deleteCard = async (req, res) => {
  try {
    const userId = req.userId;
    const { cardId } = req.params;

    const card = await Card.findOne({ _id: cardId, userId });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    card.isActive = false;
    await card.save();

    await User.findByIdAndUpdate(userId, {
      $pull: { savedCards: cardId }
    });

    res.json({
      success: true,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete card',
      error: error.message
    });
  }
};

const setDefaultCard = async (req, res) => {
  try {
    const userId = req.userId;
    const { cardId } = req.params;

    const card = await Card.findOne({ _id: cardId, userId, isActive: true });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    await Card.updateMany(
      { userId, isActive: true },
      { $set: { isDefault: false } }
    );

    card.isDefault = true;
    await card.save();

    res.json({
      success: true,
      message: 'Default card updated successfully'
    });
  } catch (error) {
    console.error('Set default card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default card',
      error: error.message
    });
  }
};

const getCardToken = async (req, res) => {
  try {
    const userId = req.userId;
    const { cardId } = req.params;

    const card = await Card.findOne({ _id: cardId, userId, isActive: true });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    res.json({
      success: true,
      data: {
        cardToken: card.cardToken,
        monnifyCardReference: card.monnifyCardReference
      }
    });
  } catch (error) {
    console.error('Get card token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get card token',
      error: error.message
    });
  }
};

module.exports = {
  saveCard,
  getUserCards,
  deleteCard,
  setDefaultCard,
  getCardToken
};
