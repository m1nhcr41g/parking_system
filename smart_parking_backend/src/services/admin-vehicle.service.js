const adminVehicleRepository = require("../repositories/admin-vehicle.repository");

const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

async function updateVehicleStatus(vehicleId, status, statusReason, adminId) {
  if (!vehicleId) {
    const error = new Error("Thiếu ID phương tiện");
    error.code = "VEHICLE_ID_REQUIRED";
    throw error;
  }

  if (!adminId) {
    const error = new Error("Thiếu ID Admin");
    error.code = "ADMIN_ID_REQUIRED";
    throw error;
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    const error = new Error(
      "Trạng thái phải là ACTIVE, INACTIVE hoặc SUSPENDED"
    );
    error.code = "INVALID_VEHICLE_STATUS";
    throw error;
  }
    if (
    ["INACTIVE", "SUSPENDED"].includes(status) &&
    !statusReason?.trim()
  ) {
    const error = new Error(
      "Vui lòng cung cấp lý do khi khóa hoặc ngừng kích hoạt xe"
    );
    error.code = "STATUS_REASON_REQUIRED";
    throw error;
  }
  
  try {
    return await adminVehicleRepository.updateVehicleStatus(
      vehicleId,
      status,
      statusReason,
      adminId
    );
  } catch (error) {
    if (error.message === "ADMIN_NOT_FOUND") {
      error.code = "ADMIN_NOT_FOUND";
      error.message = "Admin không tồn tại hoặc không hoạt động";
    } else if (error.message === "VEHICLE_NOT_FOUND") {
      error.code = "VEHICLE_NOT_FOUND";
      error.message = "Không tìm thấy phương tiện";
    }
    throw error;
  }
}

module.exports = { updateVehicleStatus };
