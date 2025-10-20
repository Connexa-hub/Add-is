const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { subscribeTV, buyData, payElectricity, buyEducation, buyInsurance, buyOtherService } = require('../controllers/serviceController');
const { tvSubscriptionValidation, dataPurchaseValidation } = require('../middleware/validation');

router.get('/data-plans/:serviceID', verifyToken, require('../controllers/serviceController').getDataPlans);
router.post('/subscribe-tv', verifyToken, tvSubscriptionValidation, subscribeTV);
router.post('/buy-data', verifyToken, dataPurchaseValidation, buyData);
router.post('/buy-airtime', verifyToken, require('../controllers/serviceController').buyAirtime);
router.post('/pay-electricity', verifyToken, payElectricity);
router.post('/education', verifyToken, buyEducation);
router.post('/insurance', verifyToken, buyInsurance);
router.post('/internet', verifyToken, buyOtherService);
router.post('/betting', verifyToken, buyOtherService);

module.exports = router;
