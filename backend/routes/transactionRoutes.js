const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const { getAllTransactions, getUserTransactions, getUserRecentTransactions, getTransactionByReference } = require('../controllers/transactionController');
const { transactionQueryValidation } = require('../middleware/validation');

router.get('/all', verifyToken, isAdmin, transactionQueryValidation, getAllTransactions);
router.get('/mine', verifyToken, transactionQueryValidation, getUserTransactions);
router.get('/recent', verifyToken, transactionQueryValidation, getUserRecentTransactions);
router.get('/:reference', verifyToken, getTransactionByReference);

module.exports = router;
