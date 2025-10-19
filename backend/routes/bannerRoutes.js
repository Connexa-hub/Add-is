const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const bannerController = require('../controllers/bannerController');

router.get('/', bannerController.getBanners);
router.post('/:bannerId/impression', bannerController.trackImpression);
router.post('/:bannerId/click', bannerController.trackClick);

router.get('/admin/list', verifyToken, isAdmin, bannerController.listAllBanners);
router.post('/admin', verifyToken, isAdmin, bannerController.createBanner);
router.put('/admin/:bannerId', verifyToken, isAdmin, bannerController.updateBanner);
router.delete('/admin/:bannerId', verifyToken, isAdmin, bannerController.deleteBanner);

module.exports = router;
