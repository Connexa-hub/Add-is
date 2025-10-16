// File: /addis-app/backend/models/User.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  biometricToken: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
