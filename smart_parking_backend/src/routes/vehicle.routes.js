const express = require("express");
const vehicleController = require("../controllers/vehicle.controller");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.post(
    "/vehicles",
    upload.single("registration_document"),
    vehicleController.createVehicle
);
router.get(
    "/vehicles",
    vehicleController.getVehicles
);
router.get(
    "/vehicles/:id",
    vehicleController.getVehicleById
);
router.put(
    "/vehicles/:id",
    vehicleController.updateVehicle
);
router.delete(
    "/vehicles/:id", 
    vehicleController.deleteVehicle
);

module.exports = router;