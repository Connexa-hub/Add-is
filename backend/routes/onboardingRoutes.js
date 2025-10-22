const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');

router.get('/', onboardingController.getOnboardingSlides);

module.exports = router;
