const vehicleService = require("../services/vehicle.service");

async function createVehicle(req, res) {
    try {
        const userId = req.body.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "USER_ID_REQUIRED",
                    message: "user_id là bắt buộc"
                }
            });
        }

        const result = await vehicleService.createVehicle(
            userId,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Đăng ký xe thành công",
            data: result.vehicle
        });

    } catch (error) {
        const errorMap = {
            INVALID_VEHICLE_TYPE: "Loại phương tiện không hợp lệ",
            PLATE_NUMBER_REQUIRED: "Biển số xe là bắt buộc",
            DOCUMENT_NUMBER_REQUIRED: "Số giấy đăng ký là bắt buộc",
            OWNER_NAME_REQUIRED: "Tên chủ xe là bắt buộc",
            REGISTRATION_DOCUMENT_REQUIRED:
                "Giấy đăng ký xe là bắt buộc",
            PLATE_NUMBER_EXISTS:
                "Biển số xe đã tồn tại"
        };

        return res.status(400).json({
            success: false,
            error: {
                code: error.message,
                message:
                    errorMap[error.message] ||
                    "Đăng ký xe thất bại"
            }
        });
    }
}

async function getVehicles(req, res) {
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

        const vehicles = await vehicleService.getVehiclesByUser(userId);

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách phương tiện thành công",
            data: vehicles
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            error: {
                code: "GET_VEHICLES_FAILED",
                message: "Không thể lấy danh sách phương tiện"
            }
        });
    }
}

async function getVehicleById(req, res) {
    try {
        const userId = req.query.user_id;
        const vehicleId = req.params.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "USER_ID_REQUIRED",
                    message: "user_id là bắt buộc"
                }
            });
        }

        const vehicle = await vehicleService.getVehicleById(
            userId,
            vehicleId
        );

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "VEHICLE_NOT_FOUND",
                    message: "Không tìm thấy phương tiện"
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lấy thông tin phương tiện thành công",
            data: vehicle
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            error: {
                code: "GET_VEHICLE_FAILED",
                message: "Không thể lấy thông tin phương tiện"
            }
        });
    }
}

async function updateVehicle(req, res) {
    try {
        const userId = req.body.user_id;
        const vehicleId = req.params.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "USER_ID_REQUIRED",
                    message: "user_id là bắt buộc"
                }
            });
        }

        const vehicle = await vehicleService.updateVehicle(
            userId,
            vehicleId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Cập nhật phương tiện thành công",
            data: vehicle
        });

    } catch (error) {
        const errorMap = {
            VEHICLE_NOT_FOUND: "Không tìm thấy phương tiện",
            PLATE_NUMBER_EXISTS: "Biển số xe đã tồn tại"
        };

        const statusCode =
            error.message === "VEHICLE_NOT_FOUND"
                ? 404
                : 400;

        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.message,
                message:
                    errorMap[error.message] ||
                    "Cập nhật phương tiện thất bại"
            }
        });
    }
}

async function deleteVehicle(req, res) {
    try {
        const userId = req.query.user_id;
        const vehicleId = req.params.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "USER_ID_REQUIRED",
                    message: "user_id là bắt buộc"
                }
            });
        }

        const vehicle = await vehicleService.deleteVehicle(
            userId,
            vehicleId
        );

        return res.status(200).json({
            success: true,
            message: "Xóa phương tiện thành công",
            data: vehicle
        });

    } catch (error) {
        const errorMap = {
            VEHICLE_NOT_FOUND: "Không tìm thấy phương tiện",
            VEHICLE_ALREADY_INACTIVE:
                "Phương tiện đã được xóa"
        };

        const statusCode =
            error.message === "VEHICLE_NOT_FOUND"
                ? 404
                : 400;

        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.message,
                message:
                    errorMap[error.message] ||
                    "Xóa phương tiện thất bại"
            }
        });
    }
}

module.exports = {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
};