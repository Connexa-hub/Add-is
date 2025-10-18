// File: /addis-app/backend/models/Transaction.js
const mongoose = require('mongoose');
const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userId: mongoose.Schema.Types.ObjectId,
  type: { type: String, enum: ['credit', 'debit'] },
  category: { 
    type: String, 
    enum: ['wallet_funding', 'electricity', 'data', 'tv', 'airtime', 'transfer', 'cashback', 'reversal'] 
  },
  transactionType: String,
  amount: { type: Number, required: true },
  balanceBefore: Number,
  balanceAfter: Number,
  reference: { type: String, unique: true, sparse: true },
  paymentReference: String,
  monnifyTransactionReference: String,
  monnifyPaymentReference: String,
  paymentGateway: { type: String, enum: ['monnify', 'paystack', 'vtpass', 'manual'] },
  recipient: String,
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  description: String,
  metadata: Object,
  details: Object,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ reference: 1 });
TransactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
