const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const { 
  registerValidation, 
  loginValidation, 
  profileUpdateValidation,
  walletFundValidation,
  transactionQueryValidation
} = require('../middleware/validation');
const {
  getWalletBalance,
  fundWallet,
  getWalletTransactions
} = require('../controllers/walletController');

router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        virtualAccountNumber: user.virtualAccountNumber,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/wallet', verifyToken, getWalletBalance);
router.post('/wallet/fund', verifyToken, walletFundValidation, fundWallet);
router.get('/wallet/transactions', verifyToken, transactionQueryValidation, getWalletTransactions);

router.put('/profile', verifyToken, profileUpdateValidation, async (req, res, next) => {
  try {
    const { name } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    if (name) user.name = name;
    await user.save();
    
    res.json({ 
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    
    res.status(201).json({ 
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          virtualAccountNumber: user.virtualAccountNumber
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    
    res.json({ 
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance,
          virtualAccountNumber: user.virtualAccountNumber
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/biometric-login', async (req, res, next) => {
  try {
    const { biometricToken } = req.body;
    
    if (!biometricToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Biometric token is required' 
      });
    }
    
    const user = await User.findOne({ biometricToken });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Biometric authentication failed' 
      });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    
    res.json({ 
      success: true,
      message: 'Biometric login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          walletBalance: user.walletBalance
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
