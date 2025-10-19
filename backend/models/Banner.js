const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  mediaType: {
    type: String,
    enum: ['image', 'video', 'gif', 'html'],
    default: 'image',
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  targetUrl: String,
  targetSection: [{
    type: String,
    enum: ['home', 'airtime', 'data', 'electricity', 'cable', 'wallet'],
    required: true
  }],
  weight: {
    type: Number,
    default: 1,
    min: 0,
    max: 100
  },
  activeFrom: {
    type: Date,
    default: Date.now
  },
  activeTo: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  clickCount: {
    type: Number,
    default: 0
  },
  impressionCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

BannerSchema.index({ isActive: 1, activeFrom: 1, activeTo: 1 });
BannerSchema.index({ targetSection: 1 });

module.exports = mongoose.model('Banner', BannerSchema);
