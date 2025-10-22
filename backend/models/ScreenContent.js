const mongoose = require('mongoose');

const ScreenContentSchema = new mongoose.Schema({
  // Target Screen/Route
  screenName: {
    type: String,
    required: true,
    enum: ['home', 'airtime', 'data', 'tv', 'electricity', 'betting', 'internet', 'education', 'insurance', 'transactions', 'profile', 'settings', 'global'],
    index: true
  },
  
  // Content Type
  contentType: {
    type: String,
    required: true,
    enum: ['banner', 'carousel', 'text-notice', 'promotional-text', 'alert', 'announcement'],
    index: true
  },
  
  // Content Data
  content: {
    // For text content
    text: String,
    heading: String,
    subheading: String,
    
    // For media content
    imageUrl: String,
    videoUrl: String,
    
    // Action/Link
    actionType: {
      type: String,
      enum: ['none', 'navigate', 'url', 'service']
    },
    actionData: mongoose.Schema.Types.Mixed,
    
    // Styling
    backgroundColor: String,
    textColor: String,
    position: {
      type: String,
      enum: ['top', 'middle', 'bottom', 'floating']
    }
  },
  
  // Display Rules
  displayOrder: {
    type: Number,
    default: 0
  },
  priority: {
    type: Number,
    default: 0
  },
  
  // Scheduling
  startDate: Date,
  endDate: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Analytics
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  
  // Target Audience (optional)
  targetUsers: {
    type: String,
    enum: ['all', 'new', 'active', 'inactive'],
    default: 'all'
  },
  
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

ScreenContentSchema.index({ screenName: 1, contentType: 1, isActive: 1 });
ScreenContentSchema.index({ startDate: 1, endDate: 1 });
ScreenContentSchema.index({ priority: -1, displayOrder: 1 });

module.exports = mongoose.model('ScreenContent', ScreenContentSchema);
