const crypto = require("crypto");
const { sql, poolPromise } = require("../config/database");

const vehicleRepository = require("../repositories/vehicle.repository");
const documentRepository = require("../repositories/document.repository");

async function createVehicle(userId, data) {
    const {
        plate_number,
        type,
        brand,
        model,
        color,
        manufacture_year,
        chassis_number,
        engine_number,

        document_type,
        document_number,
        owner_name,
        registration_date,
        issuing_authority,
        file_url
    } = data;

    // Validate type
    const allowedTypes = ["CAR", "MOTORBIKE", "BICYCLE"];

    if (!allowedTypes.includes(type)) {
        throw new Error("INVALID_VEHICLE_TYPE");
    }

    // CAR / MOTORBIKE
    if (type !== "BICYCLE") {
        if (!plate_number) {
            throw new Error("PLATE_NUMBER_REQUIRED");
        }

        if (!document_number) {
            throw new Error("DOCUMENT_NUMBER_REQUIRED");
        }

        if (!owner_name) {
            throw new Error("OWNER_NAME_REQUIRED");
        }

        if (!file_url) {
            throw new Error("REGISTRATION_DOCUMENT_REQUIRED");
        }
    }

    // Check duplicate plate
    if (plate_number) {
        const existingVehicle =
            await vehicleRepository.findVehicleByPlate(plate_number);

        if (existingVehicle) {
            throw new Error("PLATE_NUMBER_EXISTS");
        }
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    const vehicleId = crypto.randomUUID();

    try {
        await transaction.begin();

        const vehicle = await vehicleRepository.createVehicle(
            {
                id: vehicleId,
                plate_number: plate_number || null,
                type,
                brand: brand || null,
                model: model || null,
                color: color || null,
                manufacture_year: manufacture_year || null,
                chassis_number: chassis_number || null,
                engine_number: engine_number || null
            },
            transaction
        );

        await vehicleRepository.createVehicleOwner(
            vehicleId,
            userId,
            transaction
        );

        let document = null;

        if (type !== "BICYCLE") {
            document = await documentRepository.createRegistrationDocument(
                {
                    id: crypto.randomUUID(),
                    vehicle_id: vehicleId,
                    document_type,
                    document_number,
                    owner_name,
                    registration_date: registration_date || null,
                    issuing_authority: issuing_authority || null,
                    file_url
                },
                transaction
            );
        }

        await transaction.commit();

        return {
            vehicle,
            document
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function getVehiclesByUser(userId) {
    return await vehicleRepository.getVehiclesByUser(userId);
}

async function getVehicleById(userId, vehicleId) {
    return await vehicleRepository.getVehicleById(
        userId,
        vehicleId
    );
}

async function updateVehicle(userId, vehicleId, data) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    const vehicle = await vehicleRepository.getVehicleById(
        userId,
        vehicleId
    );

    if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
    }

    if (
        data.plate_number &&
        data.plate_number !== vehicle.plate_number
    ) {
        const existingVehicle =
            await vehicleRepository.findVehicleByPlate(
                data.plate_number
            );

        if (
            existingVehicle &&
            existingVehicle.id !== vehicleId
        ) {
            throw new Error("PLATE_NUMBER_EXISTS");
        }
    }

    try {
        await transaction.begin();

        const updatedVehicle =
            await vehicleRepository.updateVehicle(
                userId,
                vehicleId,
                {
                    plate_number:
                        data.plate_number ?? vehicle.plate_number,
                    brand: data.brand ?? vehicle.brand,
                    model: data.model ?? vehicle.model,
                    color: data.color ?? vehicle.color,
                    manufacture_year:
                        data.manufacture_year ??
                        vehicle.manufacture_year,
                    chassis_number:
                        data.chassis_number ??
                        vehicle.chassis_number,
                    engine_number:
                        data.engine_number ??
                        vehicle.engine_number
                },
                transaction
            );

        // Nếu thay đổi biển số của xe đã VERIFIED
        // thì đưa về PENDING để xác minh lại.
        if (
            vehicle.verify_status === "VERIFIED" &&
            data.plate_number &&
            data.plate_number !== vehicle.plate_number
        ) {
            await new sql.Request(transaction)
                .input("vehicle_id", sql.VarChar(36), vehicleId)
                .query(`
                    UPDATE vehicles
                    SET verify_status = 'PENDING'
                    WHERE id = @vehicle_id
                `);

            updatedVehicle.verify_status = "PENDING";
        }

        await transaction.commit();

        return updatedVehicle;

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function deleteVehicle(userId, vehicleId) {
    const vehicle = await vehicleRepository.getVehicleById(
        userId,
        vehicleId
    );

    if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
    }

    if (vehicle.status === "INACTIVE") {
        throw new Error("VEHICLE_ALREADY_INACTIVE");
    }

    return await vehicleRepository.deleteVehicle(
        userId,
        vehicleId
    );
}

module.exports = {
    createVehicle,
    getVehiclesByUser,
    getVehicleById,
    updateVehicle,
    deleteVehicle
};