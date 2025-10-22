const express = require('express');
const router = express.Router();
const onboardingController = require('../../controllers/onboardingController');
const verifyToken = require('../../middleware/verifyToken');
const isAdmin = require('../../middleware/isAdmin');

router.use(verifyToken);
router.use(isAdmin);

router.get('/', onboardingController.getAllOnboardingSlides);
router.post('/', onboardingController.createOnboardingSlide);
router.put('/:slideId', onboardingController.updateOnboardingSlide);
router.delete('/:slideId', onboardingController.deleteOnboardingSlide);
router.post('/reorder', onboardingController.reorderOnboardingSlides);

module.exports = router;
