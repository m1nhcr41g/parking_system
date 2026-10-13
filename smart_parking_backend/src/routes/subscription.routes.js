const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');

router.get('/plans', subscriptionController.getAllPlans);
router.post('/subscribe', subscriptionController.subscribePlan);
router.get('/my-plans', subscriptionController.getMySubscriptions);

module.exports = router;