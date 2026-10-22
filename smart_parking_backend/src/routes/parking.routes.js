const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parking.controller');
const { authenticateToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

router.use(authenticateToken, authorizeRoles('STAFF', 'ADMIN'));

router.post('/parking-lots',parkingController.createParkingLot);
router.get('/parking-lots',parkingController.getAllParkingLots);
router.put('/parking-lots/:id',parkingController.updateParkingLot);

router.post('/parking-areas',parkingController.createParkingArea);
router.get('/parking-areas',parkingController.getAreasByLotId);

router.post('/parking-slots/batch',parkingController.createBatchSlots);
router.put('/parking-slots/:id/status',parkingController.updateSlotStatus);

module.exports = router;