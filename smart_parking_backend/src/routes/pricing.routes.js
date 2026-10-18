const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricing.controller');

router.post('/pricing-rules', pricingController.upsertPricingRule);
router.post('/subscription-plans', pricingController.createSubscriptionPlan);
router.put('/subscription-plans/:id', pricingController.updateSubscriptionPlan);

module.exports = router;