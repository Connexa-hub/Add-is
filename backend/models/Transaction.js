// File: /addis-app/backend/models/Transaction.js
const mongoose = require('mongoose');
const TransactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  transactionType: String,
  amount: Number,
  reference: String,
  recipient: String,
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  details: Object,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Transaction', TransactionSchema);
