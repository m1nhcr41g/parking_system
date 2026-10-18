
const express = require("express");
const router = express.Router();

const staffController = require("../controllers/staff.controller");

// Danh sách xe chờ xác minh
router.get(
    "/vehicles/pending",
    staffController.getPendingVehicles
);

// Lịch sử xác minh toàn hệ thống theo tài liệu
router.get(
    "/vehicles/history-logs",
    staffController.getAllVehicleVerificationLogs
);

// Xem chi tiết hồ sơ xe
router.get(
    "/vehicles/:id",
    staffController.getVehicleForReview
);

// Tiếp nhận hồ sơ xác minh
router.patch(
    "/vehicles/:id/review",
    staffController.startVehicleReview
);

// Duyệt hoặc từ chối theo tài liệu
router.post(
    "/vehicles/:id/verify",
    staffController.decideVehicleVerification
);

// Lịch sử xác minh riêng một xe (giữ API cũ)
router.get(
    "/vehicles/:id/verification-logs",
    staffController.getVehicleVerificationLogs
);

router.post(
    "/check-in/manual", 
    staffController.manualCheckIn);

module.exports = router;
