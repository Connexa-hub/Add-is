const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ success: false, message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify token version for session invalidation with timeout
    const userPromise = User.findById(decoded.id || decoded.userId).select('tokenVersion').lean();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    );
    
    const user = await Promise.race([userPromise, timeoutPromise]);
    
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
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (e.message === 'Database query timeout') {
      return res.status(503).json({ success: false, message: 'Service temporarily unavailable', code: 'TIMEOUT' });
    }
    console.error('Token verification error:', e.message);
    res.status(401).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' });
  }
};
