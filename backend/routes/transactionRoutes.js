// File: /addis-app/backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const { getAllTransactions, getUserTransactions } = require('../controllers/transactionController');

router.get('/all', verifyToken, isAdmin, getAllTransactions);
router.get('/mine', verifyToken, getUserTransactions);

module.exports = router;
