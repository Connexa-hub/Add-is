const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const uploadController = require('../controllers/uploadController');

router.post('/', verifyToken, uploadController.uploadFile);

module.exports = router;
