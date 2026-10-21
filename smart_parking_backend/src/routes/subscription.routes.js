const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticateToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

router.use(authenticateToken, authorizeRoles('CUSTOMER'));

router.get('/plans', subscriptionController.getAllPlans);
router.post('/subscribe', subscriptionController.subscribePlan);
router.get('/my-plans', subscriptionController.getMySubscriptions);

module.exports = router;