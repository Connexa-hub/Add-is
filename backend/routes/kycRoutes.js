const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const kycController = require('../controllers/kycController');

router.post('/submit', verifyToken, kycController.submitKYC);
router.get('/status', verifyToken, kycController.getKYCStatus);

router.get('/admin/list', verifyToken, isAdmin, kycController.listPendingKYC);
router.post('/admin/:userId/approve', verifyToken, isAdmin, kycController.approveKYC);
router.post('/admin/:userId/reject', verifyToken, isAdmin, kycController.rejectKYC);

module.exports = router;
