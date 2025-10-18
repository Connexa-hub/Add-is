const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  appName: {
    type: String,
    default: 'VTU Bill Payment'
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  allowRegistration: {
    type: Boolean,
    default: true
  },
  minWalletFunding: {
    type: Number,
    default: 100
  },
  maxWalletFunding: {
    type: Number,
    default: 100000
  },
  transactionFee: {
    type: Number,
    default: 0
  },
  enableEmailNotifications: {
    type: Boolean,
    default: true
  },
  enableSMSNotifications: {
    type: Boolean,
    default: false
  },
  cashbackSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    dataPercentage: {
      type: Number,
      default: 5
    },
    electricityPercentage: {
      type: Number,
      default: 2
    },
    tvPercentage: {
      type: Number,
      default: 3
    },
    minimumTransaction: {
      type: Number,
      default: 500
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
