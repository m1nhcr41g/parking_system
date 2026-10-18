const express = require('express');
const router = express.Router();
const bookingRoutes = require('./booking.routes');
const subscriptionRoutes = require('./subscription.routes');
const parkingRoutes = require('./parking.routes');
const pricingRoutes = require('./pricing.routes');
const reportRoutes = require('./report.routes');

router.use('/customer/bookings', bookingRoutes);
router.use('/customer/subscriptions', subscriptionRoutes);

router.use('/admin', parkingRoutes);
router.use('/admin', pricingRoutes);
router.use('/admin', reportRoutes);

module.exports = router;