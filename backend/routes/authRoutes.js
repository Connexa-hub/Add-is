// File: /addis-app/backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// Add at the top
const verifyToken = require('../middleware/verifyToken');

// Get profile
router.get('/profile', verifyToken, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ name: user.name, email: user.email });
});

// Get wallet balance
router.get('/wallet', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ 
      balance: user.walletBalance || 0,
      virtualAccountNumber: user.virtualAccountNumber,
      currency: '₦'
    });
  } catch (e) {
    res.status(500).json({ message: 'Failed to get wallet balance' });
  }
});

// Update profile
router.put('/profile', verifyToken, async (req, res) => {
  const { name } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.name = name;
  await user.save();
  res.json({ message: 'Profile updated' });
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.json(user);
  } catch (e) {
    res.status(400).json({ message: 'Registration error', error: e });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token, user });
});

router.post('/biometric-login', async (req, res) => {
  const { biometricToken } = req.body;
  const user = await User.findOne({ biometricToken });
  if (!user) return res.status(401).json({ message: 'Biometric login failed' });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token, user });
});

module.exports = router;
