const service = require("../services/automatic-access.service");

async function checkIn(req, res) {
  try {
    const data = await service.checkIn(req.body);

    return res.status(201).json({
      success: true,
      message: "Check-in thành công",
      data
    });
  } catch (error) {
    const statusCodes = {
      PARKING_LOT_ID_REQUIRED: 400,
      INVALID_ACCESS_METHOD: 400,
      PLATE_NUMBER_REQUIRED: 400,
      SECURE_TOKEN_REQUIRED: 400,
      PARKING_LOT_UNAVAILABLE: 400,
      VEHICLE_NOT_FOUND: 404,
      VEHICLE_NOT_ACTIVE: 403,
      VEHICLE_NOT_VERIFIED: 403,
      CREDENTIAL_INVALID: 403,
      SMARTPASS_INACTIVE: 403,
      SESSION_ALREADY_ACTIVE: 409,
      NO_AVAILABLE_SLOT: 409
    };

    return res.status(statusCodes[error.code] || 500).json({
      success: false,
      error: {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: error.message || "Lỗi máy chủ"
      }
    });
  }
}


async function checkOut(req, res) {
  try {
    const data = await service.checkOut(req.body);

    return res.status(200).json({
      success: true,
      message: "Check-out thành công",
      data
    });
  } catch (error) {
    const statusCodes = {
      INVALID_ACCESS_METHOD: 400,
      PLATE_NUMBER_REQUIRED: 400,
      SECURE_TOKEN_REQUIRED: 400,
      PAYMENT_METHOD_REQUIRED: 400,
      ACTIVE_SESSION_NOT_FOUND: 404,
      VEHICLE_NOT_ACTIVE: 403,
      VEHICLE_NOT_VERIFIED: 403,
      CREDENTIAL_INVALID: 403,
      PRICING_RULE_NOT_FOUND: 400,
      SESSION_ALREADY_COMPLETED: 409
    };

    return res.status(statusCodes[error.code] || 500).json({
      success: false,
      error: {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: error.message || "Lỗi máy chủ"
      }
    });
  }
}

module.exports = { checkIn, checkOut };
