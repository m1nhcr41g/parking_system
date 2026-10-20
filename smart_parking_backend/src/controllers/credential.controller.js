const credentialService = require("../services/credential.service");

async function getAllCredentials(req, res) {
    try {
        const credentials = await credentialService.getAllCredentials();

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách QR/Barcode thành công",
            data: credentials,
            meta: {
                totalItems: credentials.length
            }
        });
    } catch (error) {
        console.error("getAllCredentials error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Không thể lấy danh sách QR/Barcode"
            }
        });
    }
}

async function reissueCredential(req, res) {
    try {
        const { vehicle_id } = req.body;

        const data = await credentialService.reissueCredential(vehicle_id);

        return res.status(200).json({
            success: true,
            message: "Cấp lại mã QR thành công; mã cũ đã bị thu hồi",
            data
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }

        console.error("reissueCredential error:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Không thể cấp lại mã QR"
            }
        });
    }
}

module.exports = {
    getAllCredentials,
    reissueCredential
};
