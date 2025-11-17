
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'promotion'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionType: {
    type: String,
    enum: ['transaction', 'promotion', 'system', 'cashback', 'wallet'],
    default: 'system'
  },
  actionData: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
