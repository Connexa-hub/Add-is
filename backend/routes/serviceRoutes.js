const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { subscribeTV, buyData } = require('../controllers/serviceController');
const { tvSubscriptionValidation, dataPurchaseValidation } = require('../middleware/validation');

router.post('/subscribe-tv', verifyToken, tvSubscriptionValidation, subscribeTV);
router.post('/buy-data', verifyToken, dataPurchaseValidation, buyData);

module.exports = router;
