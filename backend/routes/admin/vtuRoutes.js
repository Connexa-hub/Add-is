const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/verifyToken');
const isAdmin = require('../../middleware/isAdmin');
const vtuController = require('../../controllers/admin/vtuController');

router.get('/categories', verifyToken, isAdmin, vtuController.getCategories);

router.get('/products', verifyToken, isAdmin, vtuController.getProducts);

router.post('/products', verifyToken, isAdmin, vtuController.createProduct);

router.put('/products/:id', verifyToken, isAdmin, vtuController.updateProduct);

router.delete('/products/:id', verifyToken, isAdmin, vtuController.deleteProduct);

router.put('/products/:id/toggle', verifyToken, isAdmin, vtuController.toggleProductStatus);

router.post('/products/bulk-update', verifyToken, isAdmin, vtuController.bulkUpdateStatus);

router.post('/sync', verifyToken, isAdmin, vtuController.syncProducts);

router.get('/sync/status', verifyToken, isAdmin, vtuController.getSyncStatus);

module.exports = router;
