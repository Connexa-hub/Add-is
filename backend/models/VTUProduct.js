const mongoose = require('mongoose');

const VTUProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['airtime', 'data', 'electricity', 'cable', 'internet'],
    required: true
  },
  network: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'general'
  },
  denomination: Number,
  price: {
    type: Number,
    required: true
  },
  vendorCode: {
    type: String,
    required: true
  },
  vendor: {
    type: String,
    default: 'vtpass'
  },
  description: String,
  validity: String,
  commission: {
    type: Number,
    default: 0
  },
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
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

VTUProductSchema.index({ type: 1, network: 1, isActive: 1 });
VTUProductSchema.index({ vendorCode: 1 });
VTUProductSchema.index({ isPopular: 1 });

module.exports = mongoose.model('VTUProduct', VTUProductSchema);
