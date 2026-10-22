const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticateToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

router.use(authenticateToken,authorizeRoles('CUSTOMER'));

router.get('/available-slots',bookingController.getAvailableSlots);
router.post('/',bookingController.createBooking);
router.put('/:id/cancel',bookingController.cancelBooking);
router.get('/my-history',bookingController.getMyBooking);

module.exports = router;
