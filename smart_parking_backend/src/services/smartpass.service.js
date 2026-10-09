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

module.exports = {
    createSmartPass,
    getSmartPassesByUser
};