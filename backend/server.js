const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const validateEnv = require('./config/validateEnv');
validateEnv();

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;

if (!isProduction) {
  app.set('trust proxy', 1);
}

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { securityEventLogger } = require('./middleware/securityLogger');
const mongoSanitize = require('express-mongo-sanitize');

app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: isProduction ? undefined : false
}));

// Sanitize inputs to prevent NoSQL injection
app.use(mongoSanitize({
  replaceWith: '_'
}));

// Security event logging
app.use(securityEventLogger);

const allowedOrigins = isProduction 
  ? [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
  : ['http://localhost:5000', 'http://localhost:3000', 'http://localhost:19006', 'exp://localhost:8081'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    
    const isAllowed = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        const requestUrl = new URL(origin);
        return allowedUrl.origin === requestUrl.origin;
      } catch (e) {
        return allowed === origin;
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, isProduction ? false : true);
    }
  },
  credentials: true
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/verify-email', authLimiter);
app.use('/api/auth/resend-verification', authLimiter);
app.use('/api/kyc/submit', authLimiter);
app.use('/api/pin/setup', authLimiter);
app.use('/api/pin/verify', authLimiter);
app.use('/api/pin/change', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(logger);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve admin dashboard static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'admin-web/dist')));
}

const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const cashbackRoutes = require('./routes/cashbackRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const kycRoutes = require('./routes/kycRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const vtuRoutes = require('./routes/vtuRoutes');
const pinRoutes = require('./routes/pinRoutes');
const cardRoutes = require('./routes/cardRoutes');
const walletFundingRoutes = require('./routes/walletFundingRoutes');
const adminVtuRoutes = require('./routes/admin/vtuRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const adminOnboardingRoutes = require('./routes/admin/onboardingRoutes');
const adminSecurityRoutes = require('./routes/admin/securityRoutes');

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/support', supportRoutes);
app.use('/api/admin/cashback', cashbackRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/vtu', adminVtuRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/vtu', vtuRoutes);
app.use('/api/pin', pinRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/wallet/funding', walletFundingRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin/onboarding', adminOnboardingRoutes);
app.use('/api/admin/security', adminSecurityRoutes);

// Serve admin dashboard SPA in production
if (isProduction) {
  app.get('/*catchall', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'admin-web/dist/index.html'));
    } else {
      next();
    }
  });
}

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB connected successfully');
    
    const host = '0.0.0.0';
    
    app.listen(PORT, host, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server running on http://${host}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security: Rate limiting, CORS, Helmet, Sanitization enabled`);
      console.log(`🏥 Health check: http://${host}:${PORT}/api/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (err) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ FATAL: Failed to start server');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('MongoDB Connection Error:', err.message);
    console.error('');
    console.error('Please check:');
    console.error('  1. MONGO_URI is set correctly in environment variables');
    console.error('  2. MongoDB server is accessible');
    console.error('  3. Network connectivity to MongoDB');
    console.error('  4. Database credentials are valid');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
};

startServer();
