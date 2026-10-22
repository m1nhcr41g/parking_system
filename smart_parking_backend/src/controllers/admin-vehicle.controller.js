const adminVehicleService = require("../services/admin-vehicle.service");

async function updateVehicleStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, status_reason } = req.body;
    const adminId = req.user.id;

    const vehicle = await adminVehicleService.updateVehicleStatus(
      id,
      status,
      status_reason,
      adminId
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái phương tiện thành công",
      data: vehicle,
    });
  } catch (error) {
    const knownErrors = {
      VEHICLE_ID_REQUIRED: 400,
      ADMIN_ID_REQUIRED: 400,
      INVALID_VEHICLE_STATUS: 400,
      ADMIN_NOT_FOUND: 403,
      VEHICLE_NOT_FOUND: 404,
      STATUS_REASON_REQUIRED: 400,
    };

    return res.status(knownErrors[error.code] || 500).json({
      success: false,
      error: {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: error.message || "Lỗi máy chủ",
      },
    });
  }
}

module.exports = { updateVehicleStatus };