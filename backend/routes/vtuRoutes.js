const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const vtuController = require('../controllers/vtuController');

router.get('/products', vtuController.getProducts);
router.post('/phone/detect', vtuController.detectPhoneNetwork);

router.get('/providers/:serviceType', vtuController.getProvidersByService);
router.get('/providers/category/:category', vtuController.getProvidersByService);

router.get('/quick-amounts/:serviceType/:provider', vtuController.getQuickAmounts);

router.get('/screen-content/:screenName', vtuController.getScreenContent);

router.get('/admin/products', verifyToken, isAdmin, vtuController.listAllProducts);
router.post('/admin/products', verifyToken, isAdmin, vtuController.createProduct);
router.put('/admin/products/:productId', verifyToken, isAdmin, vtuController.updateProduct);
router.delete('/admin/products/:productId', verifyToken, isAdmin, vtuController.deleteProduct);

router.get('/admin/quick-amounts', verifyToken, isAdmin, vtuController.listQuickAmountGrids);
router.post('/admin/quick-amounts', verifyToken, isAdmin, vtuController.createQuickAmountGrid);
router.put('/admin/quick-amounts/:gridId', verifyToken, isAdmin, vtuController.updateQuickAmountGrid);
router.delete('/admin/quick-amounts/:gridId', verifyToken, isAdmin, vtuController.deleteQuickAmountGrid);

router.get('/admin/screen-content', verifyToken, isAdmin, vtuController.listScreenContent);
router.post('/admin/screen-content', verifyToken, isAdmin, vtuController.createScreenContent);
router.put('/admin/screen-content/:contentId', verifyToken, isAdmin, vtuController.updateScreenContent);
router.delete('/admin/screen-content/:contentId', verifyToken, isAdmin, vtuController.deleteScreenContent);

module.exports = router;
