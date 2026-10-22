const express = require("express");
const router = express.Router();

const adminVehicleController = require("../controllers/admin-vehicle.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.patch("/:id/status", adminVehicleController.updateVehicleStatus);

module.exports = router;