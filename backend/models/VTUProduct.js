const mongoose = require('mongoose');

const VTUProductSchema = new mongoose.Schema({
  // Product Display Info
  title: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  
  // VTPass Category (7 main categories)
  category: {
    type: String,
    enum: ['airtime', 'data', 'tv-subscription', 'electricity-bill', 'education', 'insurance', 'other-services', 'betting'],
    required: true
  },
  
  // Legacy 'type' field for backward compatibility
  type: {
    type: String,
    enum: ['airtime', 'data', 'electricity', 'cable', 'internet', 'education', 'insurance', 'betting'],
    required: true
  },
  
  // VTPass Service Details
  serviceID: {
    type: String,
    required: true,
    index: true
  },
  variationCode: {
    type: String,
    index: true
  },
  
  // Network/Provider (MTN, GLO, DSTV, etc.)
  network: {
    type: String,
    required: true
  },
  
  // Pricing
  faceValue: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    alias: 'price'
  },
  minimumAmount: Number,
  maximumAmount: Number,
  
  // Commission
  commissionRate: {
    type: Number,
    default: 0,
    alias: 'commission'
  },
  
  // Vendor Info
  vendor: {
    type: String,
    default: 'vtpass'
  },
  vendorCode: {
    type: String,
    required: true
  },
  
  // Additional Details
  validity: String,
  denomination: Number,
  
  // Status Flags
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  
  // Flexible metadata for provider-specific fields
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Sync tracking
  lastSyncedAt: Date,
  vtpassData: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

VTUProductSchema.index({ type: 1, network: 1, isActive: 1 });
VTUProductSchema.index({ vendorCode: 1 });
VTUProductSchema.index({ isPopular: 1 });

module.exports = mongoose.model('VTUProduct', VTUProductSchema);
