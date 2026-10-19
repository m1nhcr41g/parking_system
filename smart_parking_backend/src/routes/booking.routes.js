const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');

router.get('/available-slots',bookingController.getAvailableSlots);
router.post('/',bookingController.createBooking);
router.put('/:id/cancel',bookingController.cancelBooking);
router.get('/my-history',bookingController.getMyBooking);

module.exports = router;
