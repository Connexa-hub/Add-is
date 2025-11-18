
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const Cashback = require('../models/Cashback');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get all cashback configurations (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const cashbacks = await Cashback.find().sort({ createdAt: -1 });
    res.json({ success: true, data: cashbacks });
  } catch (error) {
    next(error);
  }
});

// Create cashback configuration (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { serviceType, percentage, minAmount, maxCashback, isActive } = req.body;
    
    const cashback = await Cashback.create({
      serviceType,
      percentage,
      minAmount,
      maxCashback,
      isActive
    });
    
    res.status(201).json({ success: true, data: cashback });
  } catch (error) {
    next(error);
  }
});

// Update cashback configuration (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { percentage, minAmount, maxCashback, isActive } = req.body;
    
    const cashback = await Cashback.findByIdAndUpdate(
      req.params.id,
      { percentage, minAmount, maxCashback, isActive },
      { new: true, runValidators: true }
    );
    
    if (!cashback) {
      return res.status(404).json({ success: false, message: 'Cashback configuration not found' });
    }
    
    res.json({ success: true, data: cashback });
  } catch (error) {
    next(error);
  }
});

// Delete cashback configuration (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const cashback = await Cashback.findByIdAndDelete(req.params.id);
    
    if (!cashback) {
      return res.status(404).json({ success: false, message: 'Cashback configuration not found' });
    }
    
    res.json({ success: true, message: 'Cashback configuration deleted' });
  } catch (error) {
    next(error);
  }
});

// Get user's cashback history and balance
router.get('/user/history', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const transactions = await Transaction.find({
      userId: req.userId,
      'metadata.cashbackEarned': { $gt: 0 }
    }).sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      data: {
        cashbackBalance: user.cashbackBalance,
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
