const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const idempotency = require('../middleware/idempotency');
const { subscribeTV, buyData, payElectricity, buyEducation, buyInsurance, buyOtherService } = require('../controllers/serviceController');
const { tvSubscriptionValidation, dataPurchaseValidation } = require('../middleware/validation');

router.get('/data-plans/:serviceID', verifyToken, require('../controllers/serviceController').getDataPlans);
router.post('/subscribe-tv', verifyToken, idempotency('subscribe-tv'), tvSubscriptionValidation, subscribeTV);
router.post('/buy-data', verifyToken, idempotency('buy-data'), dataPurchaseValidation, buyData);
router.post('/buy-airtime', verifyToken, idempotency('buy-airtime'), require('../controllers/serviceController').buyAirtime);
router.post('/pay-electricity', verifyToken, idempotency('pay-electricity'), payElectricity);
router.post('/education', verifyToken, idempotency('education'), buyEducation);
router.post('/insurance', verifyToken, idempotency('insurance'), buyInsurance);
router.post('/internet', verifyToken, idempotency('internet'), buyOtherService);
router.post('/betting', verifyToken, idempotency('betting'), buyOtherService);

module.exports = router;
