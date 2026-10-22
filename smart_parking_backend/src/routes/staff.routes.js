const express = require("express");
const router = express.Router();

const staffController = require("../controllers/staff.controller");

const { authenticateToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

// Tất cả API nghiệp vụ Staff yêu cầu đăng nhập với role STAFF
router.use(authenticateToken, authorizeRoles("STAFF"));

// Danh sách xe chờ xác minh
router.get(
    "/vehicles/pending",
    staffController.getPendingVehicles
);

// Lịch sử xác minh toàn hệ thống
router.get(
    "/vehicles/history-logs",
    staffController.getAllVehicleVerificationLogs
);

// Lịch sử xác minh riêng một xe
// Đặt trước /vehicles/:id để tránh xung đột đường dẫn
router.get(
    "/vehicles/:id/verification-logs",
    staffController.getVehicleVerificationLogs
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

// Duyệt hoặc từ chối hồ sơ xe
router.post(
    "/vehicles/:id/verify",
    staffController.decideVehicleVerification
);

// Check-in thủ công
router.post(
    "/check-in/manual",
    staffController.manualCheckIn
);

// Check-out thủ công
router.post(
    "/check-out/manual",
    staffController.manualCheckOut
);

// Danh sách phiên gửi xe đang hoạt động
router.get(
    "/parking-sessions/active",
    staffController.getActiveParkingSessions
);

module.exports = router;
