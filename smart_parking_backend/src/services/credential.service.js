const credentialRepository = require("../repositories/credential.repository");

async function getAllCredentials() {
    return credentialRepository.getAllCredentials();
}

async function reissueCredential(vehicleId) {
    if (
        typeof vehicleId !== "string" ||
        !vehicleId.trim()
    ) {
        const error = new Error("vehicle_id không hợp lệ");
        error.statusCode = 400;
        error.code = "INVALID_VEHICLE_ID";
        throw error;
    }

    return credentialRepository.reissueCredential(vehicleId.trim());
}

module.exports = {
    getAllCredentials,
    reissueCredential
};
