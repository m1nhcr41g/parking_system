const express = require("express");
const router = express.Router();

const vehicleController = require("../controllers/vehicle.controller");
const upload = require("../middlewares/upload.middleware");

const { authenticateToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

// Tất cả API quản lý xe yêu cầu đăng nhập với role CUSTOMER
router.use(authenticateToken, authorizeRoles("CUSTOMER"));

// Thêm xe
router.post(
    "/vehicles",
    upload.single("registration_document"),
    vehicleController.createVehicle
);

// Danh sách xe
router.get("/vehicles", vehicleController.getVehicles);

// Chi tiết xe
router.get("/vehicles/:id", vehicleController.getVehicleById);

// Cập nhật xe
router.put("/vehicles/:id", vehicleController.updateVehicle);

// Xóa mềm xe
router.delete("/vehicles/:id", vehicleController.deleteVehicle);

module.exports = router;
