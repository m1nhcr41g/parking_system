const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

router.get('/payments', reportController.getAllPayments);
router.put('/payments/:id/refund', reportController.refundPayment);
router.get('/reports/dashboard', reportController.getDashboardMetrics);

module.exports = router;