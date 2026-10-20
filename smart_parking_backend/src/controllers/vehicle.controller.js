const vehicleService = require("../services/vehicle.service");
const path = require("path");

async function createVehicle(req, res) {
    try {
        // Lấy ID từ Access Token, không lấy từ request body
        const userId = req.user.id;

        const fileUrl = req.file
            ? path.join(
                "public",
                "uploads",
                "registration-documents",
                req.file.filename
            ).replace(/\\/g, "/")
            : null;

        // Không tin user_id gửi lên từ client
        const { user_id, ...body } = req.body;

        const vehicleData = {
            ...body,
            file_url: fileUrl
        };

        const result = await vehicleService.createVehicle(
            userId,
            vehicleData
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
            PLATE_NUMBER_EXISTS: "Biển số xe đã tồn tại"
        };

        const statusCode =
            error.message === "VEHICLE_NOT_FOUND" ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.message,
                message: errorMap[error.message] || "Đăng ký xe thất bại"
            }
        });
    }
}

async function getVehicles(req, res) {
    try {
        const userId = req.user.id;

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
        const userId = req.user.id;
        const vehicleId = req.params.id;

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
        const userId = req.user.id;
        const vehicleId = req.params.id;

        // Không cho phép client thay đổi user_id
        const { user_id, ...vehicleData } = req.body;

        const vehicle = await vehicleService.updateVehicle(
            userId,
            vehicleId,
            vehicleData
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
            error.message === "VEHICLE_NOT_FOUND" ? 404 : 400;

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
        const userId = req.user.id;
        const vehicleId = req.params.id;

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
            VEHICLE_ALREADY_INACTIVE: "Phương tiện đã được xóa"
        };

        const statusCode =
            error.message === "VEHICLE_NOT_FOUND" ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.message,
                message: errorMap[error.message] || "Xóa phương tiện thất bại"
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
