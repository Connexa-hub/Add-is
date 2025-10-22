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
  kycLimits: {
    unverified: {
      maxSingleTransaction: {
        type: Number,
        default: 5000
      },
      maxDailyTransaction: {
        type: Number,
        default: 20000
      },
      maxMonthlyTransaction: {
        type: Number,
        default: 100000
      },
      maxWalletBalance: {
        type: Number,
        default: 50000
      }
    },
    tier1: {
      maxSingleTransaction: {
        type: Number,
        default: 50000
      },
      maxDailyTransaction: {
        type: Number,
        default: 200000
      },
      maxMonthlyTransaction: {
        type: Number,
        default: 1000000
      },
      maxWalletBalance: {
        type: Number,
        default: 500000
      }
    },
    tier2: {
      maxSingleTransaction: {
        type: Number,
        default: 500000
      },
      maxDailyTransaction: {
        type: Number,
        default: 2000000
      },
      maxMonthlyTransaction: {
        type: Number,
        default: 10000000
      },
      maxWalletBalance: {
        type: Number,
        default: 5000000
      }
    },
    tier3: {
      maxSingleTransaction: {
        type: Number,
        default: -1
      },
      maxDailyTransaction: {
        type: Number,
        default: -1
      },
      maxMonthlyTransaction: {
        type: Number,
        default: -1
      },
      maxWalletBalance: {
        type: Number,
        default: -1
      }
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
