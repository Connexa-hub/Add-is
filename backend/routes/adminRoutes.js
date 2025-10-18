
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// Get dashboard stats
router.get('/stats', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    const totalTransactions = await Transaction.countDocuments();
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayTransactions = await Transaction.countDocuments({ createdAt: { $gte: todayStart } });
    const todayRevenue = await Transaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalTransactions,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayTransactions,
        todayRevenue: todayRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all users with pagination
router.get('/users', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;
    
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
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

// Get user details
router.get('/users/:userId', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: { user, transactions }
    });
  } catch (error) {
    next(error);
  }
});

// Update user wallet
router.put('/users/:userId/wallet', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { amount, action, reason } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (action === 'credit') {
      user.walletBalance += parseFloat(amount);
    } else if (action === 'debit') {
      if (user.walletBalance < parseFloat(amount)) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
      user.walletBalance -= parseFloat(amount);
    }
    
    await user.save();
    
    await Transaction.create({
      userId: user._id,
      type: action === 'credit' ? 'credit' : 'debit',
      amount: parseFloat(amount),
      description: reason || `Admin ${action}`,
      status: 'completed',
      balanceAfter: user.walletBalance
    });
    
    res.json({
      success: true,
      message: 'Wallet updated successfully',
      data: { walletBalance: user.walletBalance }
    });
  } catch (error) {
    next(error);
  }
});

// Toggle user status
router.put('/users/:userId/status', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: status },
      { new: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: `User ${status ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Get all transactions
router.get('/transactions', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, type, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        transactions,
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

// Send notification to all users
router.post('/notifications/broadcast', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { title, message, type, actionType } = req.body;
    
    const users = await User.find({}, '_id');
    const notifications = users.map(user => ({
      userId: user._id,
      title,
      message,
      type: type || 'info',
      actionType: actionType || 'system'
    }));
    
    await Notification.insertMany(notifications);
    
    res.json({
      success: true,
      message: `Notification sent to ${users.length} users`
    });
  } catch (error) {
    next(error);
  }
});

// Get system analytics
router.get('/analytics', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const dailyStats = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          transactions: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const serviceStats = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
      { $group: { _id: '$serviceType', count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
    ]);
    
    res.json({
      success: true,
      data: { dailyStats, serviceStats }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
