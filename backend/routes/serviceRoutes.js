const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { subscribeTV, buyData, payElectricity } = require('../controllers/serviceController');
const { tvSubscriptionValidation, dataPurchaseValidation } = require('../middleware/validation');

router.get('/data-plans/:serviceID', verifyToken, require('../controllers/serviceController').getDataPlans);
router.post('/subscribe-tv', verifyToken, tvSubscriptionValidation, subscribeTV);
router.post('/buy-data', verifyToken, dataPurchaseValidation, buyData);
router.post('/pay-electricity', verifyToken, payElectricity);

module.exports = router;
