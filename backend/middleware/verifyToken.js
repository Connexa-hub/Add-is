const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ success: false, message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify token version for session invalidation
    const user = await User.findById(decoded.id || decoded.userId).select('tokenVersion');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }
    
    req.userId = decoded.id || decoded.userId;
    req.user = { userId: decoded.id || decoded.userId, role: decoded.role };
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
