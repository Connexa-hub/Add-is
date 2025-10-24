
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const securityLog = path.join(logDir, 'security.log');

const logSecurityEvent = (event, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({
    timestamp,
    event,
    ...details
  }) + '\n';

  fs.appendFile(securityLog, logEntry, (err) => {
    if (err) console.error('Failed to write security log:', err);
  });
};

const securityEventLogger = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Log failed authentication attempts
    if (req.path.includes('/login') && res.statusCode === 401) {
      logSecurityEvent('FAILED_LOGIN', {
        email: req.body.email,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });
    }

    // Log successful logins
    if (req.path.includes('/login') && res.statusCode === 200) {
      logSecurityEvent('SUCCESSFUL_LOGIN', {
        email: req.body.email,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });
    }

    // Log admin access
    if (req.path.startsWith('/api/admin') && req.userId) {
      logSecurityEvent('ADMIN_ACCESS', {
        userId: req.userId,
        path: req.path,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress
      });
    }

    // Log KYC submissions
    if (req.path.includes('/kyc/submit') && res.statusCode === 200) {
      logSecurityEvent('KYC_SUBMISSION', {
        userId: req.userId,
        ip: req.ip || req.connection.remoteAddress
      });
    }

    originalSend.apply(res, arguments);
  };

  next();
};

module.exports = {
  securityEventLogger,
  logSecurityEvent
};
