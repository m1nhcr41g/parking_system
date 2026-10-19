const express = require("express");
const router = express.Router();

const adminVehicleController = require("../controllers/admin-vehicle.controller");

router.patch("/:id/status", adminVehicleController.updateVehicleStatus);

module.exports = router;
