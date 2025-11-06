
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

// Get revenue trends
router.get('/analytics/revenue-trends', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    let dateFormat;
    switch (period) {
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }
    
    const trends = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
          totalTransactions: { $sum: 1 },
          successfulTransactions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
});

// Get user growth analytics
router.get('/analytics/user-growth', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    });
    
    res.json({
      success: true,
      data: {
        growth,
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction volume analytics
router.get('/analytics/transaction-volume', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    const volume = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          byCategory: {
            $push: { category: '$category', amount: '$amount', status: '$status' }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        volume,
        categoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get enhanced dashboard stats with wallet balance
router.get('/stats/enhanced', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    });
    
    const totalTransactions = await Transaction.countDocuments();
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalWalletBalance = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$walletBalance' } } }
    ]);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayStats = await Transaction.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          transactions: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      }
    ]);
    
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    const weekRevenue = await Transaction.aggregate([
      { $match: { createdAt: { $gte: weekStart }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const prevWeekRevenue = await Transaction.aggregate([
      { $match: { createdAt: { $gte: prevWeekStart, $lt: weekStart }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const revenueChange = prevWeekRevenue[0]?.total > 0
      ? ((weekRevenue[0]?.total || 0) - prevWeekRevenue[0].total) / prevWeekRevenue[0].total * 100
      : 0;
    
    res.json({
      success: true,
      totalUsers,
      activeUsers,
      totalTransactions,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalWalletBalance: totalWalletBalance[0]?.total || 0,
      todayTransactions: todayStats[0]?.transactions || 0,
      todayRevenue: todayStats[0]?.revenue || 0,
      todayFailed: todayStats[0]?.failed || 0,
      revenueChange: revenueChange.toFixed(1)
    });
  } catch (error) {
    next(error);
  }
});

// Get user activity and insights
router.get('/users/:userId/insights', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const stats = await Transaction.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
          totalReceived: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
          transactionCount: { $sum: 1 },
          avgTransactionAmount: { $avg: '$amount' }
        }
      }
    ]);
    
    const categorySpending = await Transaction.aggregate([
      { $match: { userId: user._id, type: 'debit', status: 'completed' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activityTimeline = await Transaction.find({ 
      userId,
      createdAt: { $gte: last30Days }
    })
      .select('type category amount status createdAt description')
      .sort({ createdAt: -1 })
      .limit(20);
    
    const lifetimeValue = stats[0]?.totalSpent || 0;
    const riskScore = calculateRiskScore(user, transactions);
    
    res.json({
      success: true,
      data: {
        user,
        stats: stats[0] || {},
        categorySpending,
        activityTimeline,
        lifetimeValue,
        riskScore
      }
    });
  } catch (error) {
    next(error);
  }
});

// Export transactions to CSV
router.get('/transactions/export', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { status, type, startDate, endDate } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.category = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10000);
    
    const csv = [
      'Reference,User,Email,Type,Category,Amount,Status,Payment Gateway,Date',
      ...transactions.map(t => 
        `${t.reference || 'N/A'},${t.userId?.name || 'N/A'},${t.userId?.email || 'N/A'},${t.type},${t.category},${t.amount},${t.status},${t.paymentGateway || 'N/A'},${new Date(t.createdAt).toISOString()}`
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// Get payment gateway balances
router.get('/payment-gateway/balances', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const monnifyClient = require('../utils/monnifyClient');
    const vtpassClient = require('../utils/vtpassClient');
    
    let monnifyBalance = { available: 0, ledger: 0, error: null };
    let vtpassBalance = { available: 0, error: null };
    
    try {
      const monnifyData = await monnifyClient.getAccountBalance();
      monnifyBalance = {
        available: monnifyData.availableBalance || 0,
        ledger: monnifyData.ledgerBalance || 0,
        error: null
      };
    } catch (error) {
      monnifyBalance.error = error.message;
    }
    
    try {
      const vtpassData = await vtpassClient.getBalance();
      vtpassBalance = {
        available: vtpassData.balance || 0,
        error: null
      };
    } catch (error) {
      vtpassBalance.error = error.message;
    }
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const gatewayStats = await Transaction.aggregate([
      { $match: { createdAt: { $gte: last24Hours } } },
      {
        $group: {
          _id: '$paymentGateway',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        monnify: monnifyBalance,
        vtpass: vtpassBalance,
        gatewayStats,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get reconciliation data
router.get('/reconciliation', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const totalUserWalletBalance = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$walletBalance' } } }
    ]);
    
    const fundingStats = await Transaction.aggregate([
      { 
        $match: { 
          category: 'wallet_funding',
          status: 'completed',
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const spendingStats = await Transaction.aggregate([
      { 
        $match: { 
          type: 'debit',
          status: 'completed',
          category: { $in: ['electricity', 'data', 'tv', 'airtime'] },
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const failedTransactions = await Transaction.find({
      status: 'failed',
      createdAt: dateFilter
    })
      .populate('userId', 'name email')
      .limit(50)
      .sort({ createdAt: -1 });
    
    const monnifyClient = require('../utils/monnifyClient');
    const vtpassClient = require('../utils/vtpassClient');
    
    let monnifyBalance = 0;
    let vtpassBalance = 0;
    
    try {
      const monnifyData = await monnifyClient.getAccountBalance();
      monnifyBalance = monnifyData.availableBalance || 0;
    } catch (error) {
      console.error('Monnify balance error:', error);
    }
    
    try {
      const vtpassData = await vtpassClient.getBalance();
      vtpassBalance = vtpassData.balance || 0;
    } catch (error) {
      console.error('VTPass balance error:', error);
    }
    
    const totalFunded = fundingStats[0]?.total || 0;
    const totalSpent = spendingStats[0]?.total || 0;
    const platformProfit = totalFunded - totalSpent;
    
    res.json({
      success: true,
      data: {
        totalUserWalletBalance: totalUserWalletBalance[0]?.total || 0,
        totalFundedAmount: totalFunded,
        totalSpentAmount: totalSpent,
        platformProfit,
        monnifyBalance,
        vtpassBalance,
        failedTransactions
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete user account (admin only)
router.delete('/users/:userId', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete admin accounts through this endpoint' 
      });
    }

    // Delete all related data
    const Transaction = require('../models/Transaction');
    const Card = require('../models/Card');
    const Notification = require('../models/Notification');
    const SupportTicket = require('../models/SupportTicket');
    const Cashback = require('../models/Cashback');

    await Promise.all([
      Transaction.deleteMany({ userId }),
      Card.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      SupportTicket.deleteMany({ userId }),
      Cashback.deleteMany({ userId })
    ]);

    // Deallocate Monnify reserved account if exists
    if (user.monnifyAccountReference) {
      try {
        const monnifyClient = require('../utils/monnifyClient');
        const { logSecurityEvent } = require('../middleware/securityLogger');
        
        console.log(`Attempting to deallocate Monnify account: ${user.monnifyAccountReference}`);
        const deallocateResult = await monnifyClient.deallocateReservedAccount(user.monnifyAccountReference);
        
        if (deallocateResult.success) {
          console.log(`✅ Successfully deallocated Monnify account for ${user.email}`);
          logSecurityEvent('ADMIN_MONNIFY_ACCOUNT_DEALLOCATED', {
            adminId: req.userId,
            deletedUserId: user._id,
            deletedUserEmail: user.email,
            accountReference: user.monnifyAccountReference,
            timestamp: new Date()
          });
        } else {
          console.log(`⚠️ Failed to deallocate Monnify account: ${deallocateResult.message}`);
          logSecurityEvent('ADMIN_MONNIFY_DEALLOCATION_FAILED', {
            adminId: req.userId,
            deletedUserId: user._id,
            deletedUserEmail: user.email,
            accountReference: user.monnifyAccountReference,
            error: deallocateResult.message,
            timestamp: new Date()
          });
        }
      } catch (monnifyError) {
        console.error(`❌ Error deallocating Monnify account:`, monnifyError.message);
      }
    }

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User account and all associated data deleted successfully. Monnify virtual account has been deallocated.'
    });
  } catch (error) {
    next(error);
  }
});

// Process refund
router.post('/transactions/:transactionId/refund', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    if (transaction.status !== 'failed') {
      return res.status(400).json({ success: false, message: 'Only failed transactions can be refunded' });
    }
    
    const user = await User.findById(transaction.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.walletBalance += transaction.amount;
    await user.save();
    
    await Transaction.create({
      userId: user._id,
      type: 'credit',
      category: 'reversal',
      amount: transaction.amount,
      reference: `REFUND-${transaction.reference}`,
      status: 'completed',
      description: `Refund for failed transaction: ${reason}`,
      metadata: {
        originalTransactionId: transaction._id,
        reason
      }
    });
    
    transaction.status = 'cancelled';
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        newBalance: user.walletBalance
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate risk score
function calculateRiskScore(user, transactions) {
  let score = 50;
  
  if (!user.isEmailVerified) score += 15;
  if (!user.isActive) score += 20;
  
  const failedTransactions = transactions.filter(t => t.status === 'failed').length;
  const failureRate = transactions.length > 0 ? failedTransactions / transactions.length : 0;
  score += failureRate * 30;
  
  const accountAge = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (accountAge < 7) score += 10;
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

module.exports = router;
