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
