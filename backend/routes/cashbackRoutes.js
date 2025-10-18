const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const Cashback = require('../models/Cashback');
const SystemSettings = require('../models/SystemSettings');

router.get('/settings', verifyToken, isAdmin, async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    
    res.json({
      success: true,
      data: settings.cashbackSettings
    });
  } catch (error) {
    next(error);
  }
});

router.put('/settings', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const updates = req.body;
    
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    
    settings.cashbackSettings = { ...settings.cashbackSettings, ...updates };
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json({
      success: true,
      message: 'Cashback settings updated',
      data: settings.cashbackSettings
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (status) query.status = status;
    
    const cashbacks = await Cashback.find(query)
      .populate('userId', 'name email')
      .populate('transactionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Cashback.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        cashbacks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
