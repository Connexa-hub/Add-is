const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');

router.post('/webhook/monnify', paymentController.monnifyWebhook);

router.use(verifyToken);

router.post('/initialize', paymentController.initializePayment);
router.get('/verify/:reference', paymentController.verifyPayment);
router.get('/history', paymentController.getPaymentHistory);

router.post('/virtual-account/create', paymentController.createVirtualAccount);
router.get('/virtual-account', paymentController.getVirtualAccount);

router.get('/monnify/balance', isAdmin, paymentController.getMonnifyBalance);

module.exports = router;
