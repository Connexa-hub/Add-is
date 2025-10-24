const { logSecurityEvent } = require('./securityLogger');

const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error for debugging (but don't expose in production)
  if (!isProduction) {
    console.error('Error:', err);
  }

  // Log security-relevant errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    logSecurityEvent('TOKEN_ERROR', {
      error: err.name,
      path: req.path,
      ip: req.ip || req.connection.remoteAddress
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // In production, don't expose internal error details
  const message = isProduction ? 'Internal Server Error' : (err.message || 'Internal Server Error');
  const statusCode = err.statusCode || 500;

  // Log critical errors
  if (statusCode >= 500) {
    logSecurityEvent('CRITICAL_ERROR', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.userId // Assuming userId is attached to the request by previous middleware
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;