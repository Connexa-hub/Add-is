const mongoose = require('mongoose');

const QuickAmountGridSchema = new mongoose.Schema({
  // Service Type (airtime, data, electricity, tv, betting, etc.)
  serviceType: {
    type: String,
    required: true,
    enum: ['airtime', 'data', 'electricity', 'tv-subscription', 'betting', 'internet', 'education', 'insurance', 'other'],
    index: true
  },
  
  // Provider/Network (MTN, Airtel, DStv, IBEDC, etc.)
  provider: {
    type: String,
    required: true,
    index: true
  },
  
  // Provider ID (matches serviceID from VTPass)
  providerId: {
    type: String,
    required: true
  },
  
  // Quick Amount Values
  amounts: [{
    type: Number,
    required: true
  }],
  
  // Grid Layout Configuration
  layout: {
    columns: {
      type: Number,
      default: 3,
      min: 1,
      max: 4
    },
    rows: {
      type: Number,
      default: 2,
      min: 1,
      max: 6
    }
  },
  
  // Amount Constraints
  minAmount: {
    type: Number,
    default: 50
  },
  maxAmount: {
    type: Number,
    default: 1000000
  },
  allowCustomInput: {
    type: Boolean,
    default: true
  },
  
  // Display Settings
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  label: String,
  description: String,
  
  // Admin tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Compound index for efficient lookups
QuickAmountGridSchema.index({ serviceType: 1, provider: 1 }, { unique: true });
QuickAmountGridSchema.index({ providerId: 1 });
QuickAmountGridSchema.index({ isActive: 1 });

module.exports = mongoose.model('QuickAmountGrid', QuickAmountGridSchema);
