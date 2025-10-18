// File: /addis-app/backend/controllers/transactionController.js
const Transaction = require('../models/Transaction');

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (e) {
    res.status(500).json({ message: 'Failed to get transactions' });
  }
};

exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId });
    res.json(transactions);
  } catch (e) {
    res.status(500).json({ message: 'Failed to get user transactions' });
  }
};

exports.getUserRecentTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(transactions);
  } catch (e) {
    res.status(500).json({ message: 'Failed to get recent transactions' });
  }
};
