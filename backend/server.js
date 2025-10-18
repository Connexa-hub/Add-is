const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const validateEnv = require('./config/validateEnv');
validateEnv();

const app = express();

// Production configuration
const isProduction = process.env.NODE_ENV === 'production';

// Port configuration with fallback
const PORT = process.env.PORT || 3001;

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

app.use(cors());
app.use(express.json());
app.use(logger);

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
app.use('/api/payment', paymentRoutes);

// Serve admin dashboard SPA in production
if (isProduction) {
  app.get('*', (req, res, next) => {
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
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 Health check: http://0.0.0.0:${PORT}/api/health`);
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
