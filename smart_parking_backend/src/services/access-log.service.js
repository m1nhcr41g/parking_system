const accessLogRepository = require("../repositories/access-log.repository");

async function getAccessLogs(filters = {}) {
    const direction = filters.direction?.trim().toUpperCase();

    if (direction && !["IN", "OUT"].includes(direction)) {
        const error = new Error("direction chỉ nhận IN hoặc OUT");
        error.statusCode = 400;
        error.code = "INVALID_DIRECTION";
        throw error;
    }

    return accessLogRepository.getAccessLogs({
        plate_number: filters.plate_number?.trim(),
        direction
    });
}

const getCustomerAccessLogs = async (filters) => {
  const { user_id, direction, plate_number } = filters;

  if (!user_id) {
    const error = new Error("user_id là bắt buộc");
    error.statusCode = 400;
    error.code = "USER_ID_REQUIRED";
    throw error;
  }

  if (
    direction &&
    !["CHECK_IN", "CHECK_OUT"].includes(direction)
  ) {
    const error = new Error(
      "direction phải là CHECK_IN hoặc CHECK_OUT"
    );
    error.statusCode = 400;
    error.code = "INVALID_DIRECTION";
    throw error;
  }

  return accessLogRepository.getCustomerAccessLogs({
    user_id,
    direction,
    plate_number,
  });
};

module.exports = {
    getAccessLogs,
    getCustomerAccessLogs
};
