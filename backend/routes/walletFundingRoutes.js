const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const walletFundingController = require('../controllers/walletFundingController');

router.post('/initialize', verifyToken, walletFundingController.initializeWalletFunding);
router.post('/verify', verifyToken, walletFundingController.verifyWalletFunding);
router.post('/webhook', walletFundingController.handleMonnifyWebhook);
router.post('/save-card', verifyToken, walletFundingController.saveCardAfterPayment);
router.post('/charge-card', verifyToken, walletFundingController.chargeCard);

module.exports = router;
