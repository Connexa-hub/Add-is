// File: /addis-app/backend/routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { subscribeTV, buyData } = require('../controllers/serviceController');

router.post('/subscribe-tv', verifyToken, subscribeTV);
router.post('/buy-data', verifyToken, buyData);

module.exports = router;
