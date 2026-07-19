// File: /addis-app/backend/models/User.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phoneNumber: String,
  profilePicture: String,
  // DEPRECATED: kept (but no longer written to) so existing documents don't
  // break schema validation during the migration window. Replaced by
  // biometricDevices below — a single global bearer token shared across
  // every device on the account had no way to revoke one device without
  // logging out all of them, and never expired or rotated.
  biometricToken: String,
  biometricDevices: [{
    deviceId: { type: String, required: true }, // client-generated, stable per install
    tokenHash: { type: String, required: true }, // sha256 of the device's biometric credential — never store it raw
    label: String, // e.g. "iPhone 14" — best-effort from client
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: Date
  }],
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
  cashbackBalance: { type: Number, default: 0 },
  virtualAccountNumber: { type: String, default: () => '247' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0') },
  monnifyAccountReference: String,
  monnifyAccounts: [{
    accountNumber: String,
    accountName: String,
    bankName: String,
    bankCode: String,
    reservationReference: String,
    collectionChannel: String,
    createdAt: { type: Date, default: Date.now }
  }],
  resetPasswordOTP: String,
  resetPasswordExpires: Date,
  resetPinOTP: String,
  resetPinExpires: Date,
  pinResetToken: String,
  pinResetTokenExpires: Date,
  tokenVersion: { type: Number, default: 0 },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
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