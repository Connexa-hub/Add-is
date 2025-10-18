const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const SupportTicket = require('../models/SupportTicket');

router.get('/tickets', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await SupportTicket.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tickets/:ticketId', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId)
      .populate('userId', 'name email')
      .populate('replies.userId', 'name email');
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
});

router.put('/tickets/:ticketId/status', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.ticketId,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Ticket status updated',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
});

router.post('/tickets/:ticketId/reply', verifyToken, isAdmin, async (req, res, next) => {
  try {
    const { message } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    ticket.replies.push({
      userId: req.userId,
      message,
      isAdmin: true,
      createdAt: new Date()
    });
    
    ticket.status = 'pending';
    ticket.updatedAt = new Date();
    await ticket.save();
    
    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
