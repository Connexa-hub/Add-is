const mongoose = require('mongoose');

const cashbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  amount: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'credited', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cashback', cashbackSchema);
