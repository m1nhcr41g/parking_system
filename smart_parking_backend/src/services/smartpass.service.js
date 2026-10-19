const smartpassRepository = require("../repositories/smartpass.repository");
const { generateQrToken } = require("./qr.service");

async function createSmartPass(userId, vehicleId) {
    const vehicle = await smartpassRepository.getVehicleById(
        userId,
        vehicleId
    );

    if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
    }

    if (vehicle.status !== "ACTIVE") {
        throw new Error("VEHICLE_NOT_ACTIVE");
    }

    if (vehicle.verify_status !== "VERIFIED") {
        throw new Error("VEHICLE_NOT_VERIFIED");
    }

    const qrToken = generateQrToken();

    return await smartpassRepository.createSmartPass(
        vehicleId,
        qrToken
    );
}

async function getSmartPassesByUser(userId) {
    return await smartpassRepository.getSmartPassesByUser(userId);
}

async function updateAutoPay(userId, smartPassId, autoPay) {
    if (typeof autoPay !== "boolean") {
        throw new Error("INVALID_AUTO_PAY");
    }

    const result = await smartpassRepository.updateAutoPay(
        userId,
        smartPassId,
        autoPay
    );

    if (!result) {
        throw new Error("SMARTPASS_NOT_FOUND_OR_INACTIVE");
    }

    return result;
}

module.exports = {
    createSmartPass,
    getSmartPassesByUser,
    updateAutoPay
};