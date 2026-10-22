const smartpassService = require("../services/smartpass.service");

async function createSmartPass(req, res) {
    try {
        // Lấy ID từ JWT, không lấy từ req.body
        const userId = req.user.id;
        const vehicleId = req.body.vehicle_id;

        if (!vehicleId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VEHICLE_ID_REQUIRED",
                    message: "vehicle_id là bắt buộc"
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
        const userId = req.user.id;

        const smartpasses =
            await smartpassService.getSmartPassesByUser(userId);

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
        const userId = req.user.id;
        const smartPassId = req.params.id;
        const autoPay = req.body.auto_pay;

        if (typeof autoPay !== "boolean") {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_AUTO_PAY",
                    message: "auto_pay phải là true hoặc false"
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

        const isInvalidAutoPay = error.message === "INVALID_AUTO_PAY";

        return res.status(
            isNotFound ? 404 : isInvalidAutoPay ? 400 : 500
        ).json({
            success: false,
            error: {
                code: isNotFound
                    ? "SMARTPASS_NOT_FOUND"
                    : isInvalidAutoPay
                        ? "INVALID_AUTO_PAY"
                        : "SMARTPASS_UPDATE_FAILED",
                message: isNotFound
                    ? "Không tìm thấy SmartPass đang hoạt động thuộc tài khoản này"
                    : isInvalidAutoPay
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
