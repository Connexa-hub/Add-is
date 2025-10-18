// File: /addis-app/backend/middleware/verifyToken.js
const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id || decoded.userId;
    req.user = { userId: decoded.id || decoded.userId, role: decoded.role };
    next();
  } catch (e) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
