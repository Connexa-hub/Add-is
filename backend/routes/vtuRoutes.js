const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const vtuController = require('../controllers/vtuController');

router.get('/products', vtuController.getProducts);
router.post('/phone/detect', vtuController.detectPhoneNetwork);

router.get('/admin/products', verifyToken, isAdmin, vtuController.listAllProducts);
router.post('/admin/products', verifyToken, isAdmin, vtuController.createProduct);
router.put('/admin/products/:productId', verifyToken, isAdmin, vtuController.updateProduct);
router.delete('/admin/products/:productId', verifyToken, isAdmin, vtuController.deleteProduct);

module.exports = router;
