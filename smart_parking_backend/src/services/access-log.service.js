const accessLogRepository = require("../repositories/access-log.repository");

const DIRECTIONS = ["CHECK_IN", "CHECK_OUT"];

async function getAccessLogs(filters = {}) {
  const direction =
    typeof filters.direction === "string"
      ? filters.direction.trim().toUpperCase()
      : undefined;

  const plateNumber =
    typeof filters.plate_number === "string"
      ? filters.plate_number.trim()
      : undefined;

  if (direction && !DIRECTIONS.includes(direction)) {
    const error = new Error(
      "direction phải là CHECK_IN hoặc CHECK_OUT"
    );
    error.statusCode = 400;
    error.code = "INVALID_DIRECTION";
    throw error;
  }

  return accessLogRepository.getAccessLogs({
    plate_number: plateNumber || undefined,
    direction,
  });
}

async function getCustomerAccessLogs(filters = {}) {
  const { user_id, direction, plate_number } = filters;

  if (!user_id) {
    const error = new Error("Không xác định được người dùng");
    error.statusCode = 401;
    error.code = "USER_ID_REQUIRED";
    throw error;
  }

  const normalizedDirection =
    typeof direction === "string"
      ? direction.trim().toUpperCase()
      : undefined;

  if (
    normalizedDirection &&
    !DIRECTIONS.includes(normalizedDirection)
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
    direction: normalizedDirection,
    plate_number:
      typeof plate_number === "string"
        ? plate_number.trim() || undefined
        : undefined,
  });
}

module.exports = {
  getAccessLogs,
  getCustomerAccessLogs,
};
