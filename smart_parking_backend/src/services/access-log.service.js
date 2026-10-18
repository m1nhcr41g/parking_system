
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

module.exports = {
    getAccessLogs
};
