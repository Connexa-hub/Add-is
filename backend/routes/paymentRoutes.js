
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middleware/verifyToken');

// All routes require authentication
router.use(verifyToken);

// Initialize payment
router.post('/initialize', paymentController.initializePayment);

// Verify payment
router.get('/verify/:reference', paymentController.verifyPayment);

// Get payment history
router.get('/history', paymentController.getPaymentHistory);

module.exports = router;
