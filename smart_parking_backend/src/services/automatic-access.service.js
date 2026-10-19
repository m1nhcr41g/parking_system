const repository = require("../repositories/automatic-access.repository");

const METHODS = ["LICENSE_PLATE", "QR_CODE", "BARCODE"];

async function checkIn(data) {
  if (!data.parking_lot_id) {
    const error = new Error("Thiếu parking_lot_id");
    error.code = "PARKING_LOT_ID_REQUIRED";
    throw error;
  }

  if (!METHODS.includes(data.method)) {
    const error = new Error(
      "method phải là LICENSE_PLATE, QR_CODE hoặc BARCODE"
    );
    error.code = "INVALID_ACCESS_METHOD";
    throw error;
  }

  if (data.method === "LICENSE_PLATE" && !data.plate_number) {
    const error = new Error("Thiếu plate_number");
    error.code = "PLATE_NUMBER_REQUIRED";
    throw error;
  }

  if (data.method !== "LICENSE_PLATE" && !data.secure_token) {
    const error = new Error("Thiếu secure_token");
    error.code = "SECURE_TOKEN_REQUIRED";
    throw error;
  }

  try {
    return await repository.checkIn(data);
  } catch (error) {
    const knownErrors = {
      PARKING_LOT_UNAVAILABLE: "Bãi xe không tồn tại hoặc không hoạt động",
      VEHICLE_NOT_FOUND: "Không tìm thấy phương tiện",
      VEHICLE_NOT_ACTIVE: "Phương tiện không hoạt động",
      VEHICLE_NOT_VERIFIED: "Phương tiện chưa được xác minh",
      CREDENTIAL_INVALID: "QR/Barcode không hợp lệ hoặc đã hết hạn",
      SMARTPASS_INACTIVE: "SmartPass không hoạt động",
      SESSION_ALREADY_ACTIVE: "Phương tiện đang có phiên gửi xe",
      NO_AVAILABLE_SLOT: "Không còn chỗ trống phù hợp"
    };

    if (knownErrors[error.message]) {
      error.code = error.message;
      error.message = knownErrors[error.code];
    }

    throw error;
  }
}


async function checkOut(data) {
  const methods = ["LICENSE_PLATE", "QR_CODE", "BARCODE"];

  if (!methods.includes(data.method)) {
    const error = new Error("Phương thức nhận diện không hợp lệ");
    error.code = "INVALID_ACCESS_METHOD";
    throw error;
  }

  if (data.method === "LICENSE_PLATE" && !data.plate_number) {
    const error = new Error("Thiếu plate_number");
    error.code = "PLATE_NUMBER_REQUIRED";
    throw error;
  }

  if (data.method !== "LICENSE_PLATE" && !data.secure_token) {
    const error = new Error("Thiếu secure_token");
    error.code = "SECURE_TOKEN_REQUIRED";
    throw error;
  }

  if (
    typeof data.payment_method !== "string" ||
    !data.payment_method.trim()
  ) {
    const error = new Error("Thiếu payment_method");
    error.code = "PAYMENT_METHOD_REQUIRED";
    throw error;
  }

  try {
    return await repository.checkOut(data);
  } catch (error) {
    const messages = {
      ACTIVE_SESSION_NOT_FOUND: "Không tìm thấy phiên gửi xe đang hoạt động",
      VEHICLE_NOT_ACTIVE: "Phương tiện không hoạt động",
      VEHICLE_NOT_VERIFIED: "Phương tiện chưa được xác minh",
      CREDENTIAL_INVALID: "QR/Barcode không hợp lệ hoặc đã hết hạn",
      PRICING_RULE_NOT_FOUND: "Chưa cấu hình bảng giá cho loại xe này",
      SESSION_ALREADY_COMPLETED: "Phiên gửi xe đã được kết thúc"
    };

    if (messages[error.message]) {
      error.code = error.message;
      error.message = messages[error.code];
    }

    throw error;
  }
}

module.exports = { checkIn, checkOut };
