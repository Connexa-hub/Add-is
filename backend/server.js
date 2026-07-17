const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();
require('./config/validateEnv')();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

// Middlewar
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { securityEventLogger } = require('./middleware/securityLogger');

// Trust proxy - required for production deployments behind reverse proxies
app.set('trust proxy', 1);

// Security headers
//
// CSP is defined explicitly rather than relying on Helmet's generic default.
// This app serves the admin-web SPA same-origin in production (backend/admin-web/dist)
// and it calls the API via a relative `/api` path with no external CDN/font
// dependencies (verified against backend/admin-web/src and index.html), so a
// tight self-only policy is viable — anything broader would just be
// unused attack surface.
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            // React/Vite production builds can emit some inline styles for
            // critical CSS; styles carry far lower XSS risk than scripts so
            // 'unsafe-inline' is scoped to style-src only, never script-src.
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: []
          }
        }
      : false,
    crossOriginEmbedderPolicy: isProduction ? undefined : false,
  })
);

// Sanitize inputs to prevent NoSQL injection
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);

// Security event logging
app.use(securityEventLogger);

// CORS
const allowedOrigins = isProduction
  ? [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
  : ['http://localhost:5000', 'http://localhost:3000', 'http://localhost:19006', 'exp://localhost:8081'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((allowed) => {
        try {
          return new URL(allowed).origin === new URL(origin).origin;
        } catch {
          return allowed === origin;
        }
      });
      callback(null, isAllowed || !isProduction);
    },
    credentials: true,
  })
);

// Rate limiting - More lenient in development for testing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 50 : 100, // Increased from 10 to 50 for production
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/', authLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(logger);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
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
app.use('/pin', pinRoutes);
app.use('/api/pin', pinRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/wallet/funding', walletFundingRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin/onboarding', adminOnboardingRoutes);
app.use('/api/admin/security', adminSecurityRoutes);
if (process.env.NODE_ENV === 'production' && require('fs').existsSync(path.join(__dirname, 'admin-web', 'dist'))) {
  const adminDistPath = path.join(__dirname, 'admin-web', 'dist');

  // Serve static files
  app.use(express.static(adminDistPath));

  // Catch-all: send index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(adminDistPath, 'index.html'));
  });
}
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/addis' || 'mongodb://localhost:27017/addis' || 'mongodb://localhost:27017/addis' || 'mongodb://localhost:27017/addis' || 'mongodb://localhost:27017/addis' || 'mongodb://localhost:27017/addis' || "mongodb://localhost:27017/addis", { serverSelectionTimeoutMS: 5000 });
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
    console.error('MongoDB Connection Error:', err.message);
    console.error('Please check MONGO_URI and network connectivity.');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
};

startServer();