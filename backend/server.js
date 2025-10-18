const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();

// Production configuration
const isProduction = process.env.NODE_ENV === 'production';

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

app.use(cors());
app.use(express.json());
app.use(logger);

// Serve admin dashboard static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../admin-web/dist')));
}

const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const cashbackRoutes = require('./routes/cashbackRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

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

// Serve admin dashboard SPA in production
if (isProduction) {
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../admin-web/dist/index.html'));
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

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT, '0.0.0.0', () =>
    console.log(`Server running on http://0.0.0.0:${process.env.PORT}`)))
  .catch(err => console.error('MongoDB error:', err));
