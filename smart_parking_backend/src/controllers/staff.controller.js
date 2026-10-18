const staffService = require("../services/staff.service");

async function getPendingVehicles(req, res) {
    try {
        const vehicles = await staffService.getPendingVehicles();

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách phương tiện chờ xác minh thành công",
            data: vehicles,
            meta: {
                totalItems: vehicles.length
            }
        });
    } catch (error) {
        console.error("getPendingVehicles error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Không thể lấy danh sách phương tiện chờ xác minh"
            }
        });
    }
}


async function getVehicleForReview(req, res) {
    try {
        const vehicle = await staffService.getVehicleForReview(
            req.params.id
        );

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "VEHICLE_NOT_FOUND",
                    message: "Không tìm thấy phương tiện"
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lấy hồ sơ phương tiện thành công",
            data: vehicle
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }

        console.error("getVehicleForReview error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Không thể lấy hồ sơ phương tiện"
            }
        });
    }
}

async function startVehicleReview(req, res) {
    try {
        const { reviewer_id } = req.body;

        const data = await staffService.startVehicleReview(
            req.params.id,
            reviewer_id
        );

        return res.status(200).json({
            success: true,
            message: "Tiếp nhận hồ sơ xác minh thành công",
            data
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Không thể tiếp nhận hồ sơ"
            }
        });
    }
}

async function decideVehicleVerification(req, res) {
    try {
        const { reviewer_id, decision, reason } = req.body;

        const data = await staffService.decideVehicleVerification(
            req.params.id,
            reviewer_id,
            decision,
            reason
        );

        return res.status(200).json({
            success: true,
            message: decision === "VERIFIED"
                ? "Phê duyệt phương tiện thành công"
                : "Từ chối phương tiện thành công",
            data
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Không thể xử lý xác minh phương tiện"
            }
        });
    }
}


async function getVehicleVerificationLogs(req, res) {
    try {
        const vehicleId = req.params.id;

        const vehicle = await staffService.getVehicleForReview(vehicleId);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "VEHICLE_NOT_FOUND",
                    message: "Không tìm thấy phương tiện"
                }
            });
        }

        const logs = await staffService.getVehicleVerificationLogs(vehicleId);

        return res.status(200).json({
            success: true,
            message: "Lấy lịch sử xác minh thành công",
            data: logs,
            meta: {
                totalItems: logs.length
            }
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }

        console.error("getVehicleVerificationLogs error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Không thể lấy lịch sử xác minh"
            }
        });
    }
}

async function getAllVehicleVerificationLogs(req, res) {
    try {
        const logs = await staffService.getAllVehicleVerificationLogs();

        return res.status(200).json({
            success: true,
            message: "Lấy lịch sử xác minh phương tiện thành công",
            data: logs,
            meta: {
                totalItems: logs.length
            }
        });
    } catch (error) {
        console.error("getAllVehicleVerificationLogs error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Không thể lấy lịch sử xác minh phương tiện"
            }
        });
    }
}

async function manualCheckIn(req, res) {
  try {
    const data = await staffService.manualCheckIn(req.body);

    return res.status(201).json({
      success: true,
      message: "Check-in thủ công thành công",
      data,
    });
  } catch (error) {
    const errors = {
      STAFF_AND_PARKING_LOT_REQUIRED: [400, "Thiếu mã nhân viên hoặc mã bãi xe"],
      STAFF_NOT_FOUND: [403, "Nhân viên không tồn tại hoặc không hoạt động"],
      PARKING_LOT_NOT_ACTIVE: [400, "Bãi xe không hoạt động"],
      VEHICLE_ID_OR_GUEST_PLATE_REQUIRED: [400, "Cần mã phương tiện hoặc biển số khách vãng lai"],
      USE_VEHICLE_ID_OR_GUEST_PLATE: [400, "Chỉ truyền vehicle_id hoặc guest_plate"],
      VEHICLE_TYPE_REQUIRED: [400, "Thiếu loại phương tiện khách vãng lai"],
      INVALID_VEHICLE_TYPE: [400, "Loại phương tiện không hợp lệ"],
      INVALID_GUEST_PLATE: [400, "Biển số không hợp lệ"],
      VEHICLE_NOT_FOUND: [404, "Không tìm thấy phương tiện"],
      VEHICLE_NOT_ELIGIBLE: [403, "Phương tiện chưa được xác minh hoặc không hoạt động"],
      PLATE_NUMBER_REQUIRED: [400, "Phương tiện chưa có biển số"],
      VEHICLE_ALREADY_PARKED: [409, "Phương tiện đã có phiên gửi xe đang hoạt động"],
      NO_AVAILABLE_SLOT: [409, "Không còn chỗ đỗ phù hợp"],
      SLOT_NO_LONGER_AVAILABLE: [409, "Chỗ đỗ vừa được sử dụng, vui lòng thử lại"],
    };

    const [status, message] = errors[error.message] || [
      500,
      "Lỗi khi check-in thủ công",
    ];

    return res.status(status).json({
      success: false,
      error: {
        code: error.message || "INTERNAL_SERVER_ERROR",
        message,
      },
    });
  }
}

module.exports = {
    getPendingVehicles,
    getVehicleForReview,
    startVehicleReview,
    decideVehicleVerification,
    getVehicleVerificationLogs,
    getAllVehicleVerificationLogs,
    manualCheckIn
};
