// File: /addis-app/backend/models/User.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  biometricToken: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  walletBalance: { type: Number, default: 0 },
  virtualAccountNumber: { type: String, default: () => '247' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0') }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
