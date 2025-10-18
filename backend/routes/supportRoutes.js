
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

// Create support ticket (User)
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { subject, message, category } = req.body;
    
    const ticket = await SupportTicket.create({
      userId: req.userId,
      subject,
      message,
      category,
      status: 'open'
    });
    
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// Get user's tickets
router.get('/user', verifyToken, async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});

// Get all tickets (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const tickets = await SupportTicket.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});

// Get single ticket details
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'name email phone');
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    // Check if user owns the ticket or is admin
    const user = await User.findById(req.userId);
    if (ticket.userId._id.toString() !== req.userId && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// Update ticket status (Admin only)
router.put('/:id/status', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// Add response to ticket (Admin only)
router.post('/:id/response', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { response } = req.body;
    
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { 
        response,
        status: 'resolved',
        resolvedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// Delete ticket (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
