const smartpassService = require("../services/smartpass.service");

async function createSmartPass(req, res) {
    try {
        const userId = req.body.user_id;
        const vehicleId = req.body.vehicle_id;

        if (!userId || !vehicleId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "MISSING_REQUIRED_FIELDS",
                    message: "user_id và vehicle_id là bắt buộc"
                }
            });
        }

        const smartpass = await smartpassService.createSmartPass(
            userId,
            vehicleId
        );

        return res.status(201).json({
            success: true,
            message: "Đăng ký SmartPass thành công",
            data: smartpass
        });
    } catch (error) {
        const errorMap = {
            VEHICLE_NOT_FOUND: {
                status: 404,
                message: "Không tìm thấy phương tiện thuộc tài khoản này"
            },
            VEHICLE_NOT_ACTIVE: {
                status: 400,
                message: "Phương tiện không ở trạng thái ACTIVE"
            },
            VEHICLE_NOT_VERIFIED: {
                status: 400,
                message: "Phương tiện chưa được xác minh VERIFIED"
            },
            SMARTPASS_ALREADY_ACTIVE: {
                status: 409,
                message: "Phương tiện đã có SmartPass đang hoạt động"
            }
        };

        const mapped = errorMap[error.message];

        if (!mapped) {
            console.error(error);
        }

        return res.status(mapped?.status || 500).json({
            success: false,
            error: {
                code: mapped ? error.message : "SMARTPASS_CREATION_FAILED",
                message: mapped?.message || "Đăng ký SmartPass thất bại"
            }
        });
    }
}

async function getSmartPasses(req, res) {
    try {
        const userId = req.query.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "USER_ID_REQUIRED",
                    message: "user_id là bắt buộc"
                }
            });
        }

        const smartpasses = await smartpassService.getSmartPassesByUser(userId);

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách SmartPass thành công",
            data: smartpasses
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            error: {
                code: "SMARTPASS_LIST_FAILED",
                message: "Không thể lấy danh sách SmartPass"
            }
        });
    }
}

async function updateAutoPay(req, res) {
    try {
        const userId = req.body.user_id;
        const smartPassId = req.params.id;
        const autoPay = req.body.auto_pay;

        if (!userId || typeof autoPay !== "boolean") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_REQUEST",
                    message: "user_id và auto_pay (true/false) là bắt buộc"
                }
            });
        }

        const result = await smartpassService.updateAutoPay(
            userId,
            smartPassId,
            autoPay
        );

        return res.status(200).json({
            success: true,
            message: "Cập nhật AutoPay thành công",
            data: result
        });
    } catch (error) {
        const isNotFound =
            error.message === "SMARTPASS_NOT_FOUND_OR_INACTIVE";

        if (!isNotFound && error.message !== "INVALID_AUTO_PAY") {
            console.error(error);
        }

        return res.status(
            isNotFound ? 404 : error.message === "INVALID_AUTO_PAY" ? 400 : 500
        ).json({
            success: false,
            error: {
                code: error.message,
                message: isNotFound
                    ? "Không tìm thấy SmartPass đang hoạt động thuộc tài khoản này"
                    : error.message === "INVALID_AUTO_PAY"
                        ? "auto_pay phải là true hoặc false"
                        : "Cập nhật AutoPay thất bại"
            }
        });
    }
}

module.exports = {
    createSmartPass,
    getSmartPasses,
    updateAutoPay
};