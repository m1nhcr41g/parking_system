
const accessLogService = require("../services/access-log.service");

async function getAccessLogs(req, res) {
    try {
        const data = await accessLogService.getAccessLogs({
            plate_number: req.query.plate_number,
            direction: req.query.direction
        });

        return res.status(200).json({
            success: true,
            message: "Lấy nhật ký ra/vào thành công",
            data
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: {
                code: error.code || "INTERNAL_SERVER_ERROR",
                message: error.message
            }
        });
    }
}

module.exports = {
    getAccessLogs
};
