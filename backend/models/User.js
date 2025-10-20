// File: /addis-app/backend/models/User.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  biometricToken: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: String,
  verificationExpires: Date,
  lastLogin: {
    type: Date
  },
  walletBalance: { type: Number, default: 0 },
  virtualAccountNumber: { type: String, default: () => '247' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0') },
  monnifyAccountReference: String,
  monnifyAccounts: [{
    accountNumber: String,
    accountName: String,
    bankName: String,
    bankCode: String,
    createdAt: { type: Date, default: Date.now }
  }],
  resetPasswordOTP: String,
  resetPasswordExpires: Date,

  kyc: {
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted'
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
    personal: {
      fullName: String,
      dateOfBirth: Date,
      address: String,
      idNumber: String,
      bvn: String,
      nin: String,
      nationality: { type: String, default: 'Nigeria' },
      phoneNumber: String,
      state: String,
      city: String
    },
    documents: [{
      type: {
        type: String,
        enum: ['id_front', 'id_back', 'selfie'],
        required: true
      },
      url: { type: String, required: true },
      filename: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    notes: String
  },

  transactionPin: {
    hash: String,
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    lastChanged: Date,
    isSet: { type: Boolean, default: false }
  },

  biometricEnabled: {
    type: Boolean,
    default: false
  },

  savedCards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  }]
}, { timestamps: true });

UserSchema.index({ 'kyc.status': 1 });

module.exports = mongoose.model('User', UserSchema);