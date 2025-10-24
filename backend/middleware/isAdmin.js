const User = require('../models/User');
const { logSecurityEvent } = require('./securityLogger');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', {
        userId: req.userId,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    
    // Track all admin access
    logSecurityEvent('ADMIN_ACTION', {
      userId: user._id,
      email: user.email,
      path: req.path,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress
    });
    
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
