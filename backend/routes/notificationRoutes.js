
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Notification = require('../models/Notification');

// Get user's notifications
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/:id/read', verifyToken, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.put('/read-all', verifyToken, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread/count', verifyToken, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.userId,
      isRead: false
    });
    
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    // Return 0 instead of error to prevent UI from breaking
    res.json({ success: true, count: 0 });
  }
});

// Delete notification
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
