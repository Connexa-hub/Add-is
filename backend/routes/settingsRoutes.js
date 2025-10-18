const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const SystemSettings = require('../models/SystemSettings');

router.get('/', verifyToken, isAdmin, async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

router.put('/', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const updates = req.body;
    
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = await SystemSettings.create(updates);
    } else {
      Object.assign(settings, updates);
      settings.updatedAt = new Date();
      await settings.save();
    }
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
