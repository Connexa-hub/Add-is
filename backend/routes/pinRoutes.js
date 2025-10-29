const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const pinController = require('../controllers/pinController');

router.post('/setup', verifyToken, pinController.setupPin);
router.post('/verify', verifyToken, pinController.verifyPin);
router.post('/change', verifyToken, pinController.changePin);
router.get('/status', verifyToken, pinController.getPinStatus);
router.post('/biometric/toggle', verifyToken, pinController.toggleBiometric);
router.post('/forgot/request', verifyToken, pinController.requestPinReset);
router.post('/forgot/verify', verifyToken, pinController.verifyPinResetOTP);
router.post('/forgot/reset', verifyToken, pinController.resetPin);

module.exports = router;
