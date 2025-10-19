const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  cardToken: {
    type: String,
    required: true,
    unique: true
  },
  last4: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true,
    enum: ['visa', 'mastercard', 'verve', 'american-express', 'discover', 'other']
  },
  expiryMonth: {
    type: String,
    required: true
  },
  expiryYear: {
    type: String,
    required: true
  },
  cardholderName: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  monnifyCardReference: String,
  bin: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

CardSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Card', CardSchema);
