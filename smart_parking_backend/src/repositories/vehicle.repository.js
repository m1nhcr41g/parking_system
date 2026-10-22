const { sql } = require("../config/database");

async function createVehicle(data, transaction) {
    const request = new sql.Request(transaction);

    request.input("id", sql.VarChar(36), data.id);
    request.input("plate_number", sql.VarChar(20), data.plate_number);
    request.input("type", sql.VarChar(20), data.type);
    request.input("brand", sql.VarChar(100), data.brand);
    request.input("model", sql.VarChar(100), data.model);
    request.input("color", sql.VarChar(50), data.color);
    request.input("manufacture_year", sql.Int, data.manufacture_year);
    request.input("chassis_number", sql.VarChar(100), data.chassis_number);
    request.input("engine_number", sql.VarChar(100), data.engine_number);

    const result = await request.query(`
        INSERT INTO vehicles (
            id,
            plate_number,
            type,
            brand,
            model,
            color,
            manufacture_year,
            chassis_number,
            engine_number
        )
        OUTPUT
            INSERTED.id,
            INSERTED.plate_number,
            INSERTED.type,
            INSERTED.brand,
            INSERTED.model,
            INSERTED.color,
            INSERTED.manufacture_year,
            INSERTED.verify_status,
            INSERTED.status,
            INSERTED.created_at
        VALUES (
            @id,
            @plate_number,
            @type,
            @brand,
            @model,
            @color,
            @manufacture_year,
            @chassis_number,
            @engine_number
        )
    `);

    return result.recordset[0];
}

async function createVehicleOwner(vehicleId, userId, transaction) {
    const request = new sql.Request(transaction);

    request.input("user_id", sql.VarChar(36), userId);
    request.input("vehicle_id", sql.VarChar(36), vehicleId);

    const result = await request.query(`
        INSERT INTO vehicle_owners (
            user_id,
            vehicle_id,
            driver_role
        )
        OUTPUT
            INSERTED.id,
            INSERTED.user_id,
            INSERTED.vehicle_id,
            INSERTED.driver_role
        VALUES (
            @user_id,
            @vehicle_id,
            'OWNER'
        )
    `);

    return result.recordset[0];
}

async function findVehicleByPlate(plateNumber) {
    const pool = await require("../config/database").poolPromise;

    const request = pool.request();

    request.input("plate_number", sql.VarChar(20), plateNumber);

    const result = await request.query(`
        SELECT id, plate_number
        FROM vehicles
        WHERE plate_number = @plate_number
    `);

    return result.recordset[0] || null;
}

async function getVehiclesByUser(userId) {
    const pool = await require("../config/database").poolPromise;

    const request = pool.request();

    request.input("user_id", sql.VarChar(36), userId);

    const result = await request.query(`
        SELECT
            v.id,
            v.plate_number,
            v.type,
            v.brand,
            v.model,
            v.color,
            v.manufacture_year,
            v.verify_status,
            v.status,
            v.created_at,
            vo.driver_role
        FROM vehicles v
        INNER JOIN vehicle_owners vo
            ON v.id = vo.vehicle_id
        WHERE vo.user_id = @user_id
        ORDER BY v.created_at DESC
    `);

    return result.recordset;
}

async function getVehicleById(userId, vehicleId) {
    const pool = await require("../config/database").poolPromise;

    const request = pool.request();

    request.input("user_id", sql.VarChar(36), userId);
    request.input("vehicle_id", sql.VarChar(36), vehicleId);

    const result = await request.query(`
        SELECT
            v.id,
            v.plate_number,
            v.type,
            v.brand,
            v.model,
            v.color,
            v.manufacture_year,
            v.chassis_number,
            v.engine_number,
            v.verify_status,
            v.status,
            v.status_reason,
            v.created_at,
            vo.driver_role
        FROM vehicles v
        INNER JOIN vehicle_owners vo
            ON v.id = vo.vehicle_id
        WHERE v.id = @vehicle_id
          AND vo.user_id = @user_id
    `);

    return result.recordset[0] || null;
}

async function updateVehicle(userId, vehicleId, data, transaction) {
    const request = new sql.Request(transaction);

    request.input("user_id", sql.VarChar(36), userId);
    request.input("vehicle_id", sql.VarChar(36), vehicleId);
    request.input("plate_number", sql.VarChar(20), data.plate_number);
    request.input("brand", sql.VarChar(100), data.brand);
    request.input("model", sql.VarChar(100), data.model);
    request.input("color", sql.VarChar(50), data.color);
    request.input("manufacture_year", sql.Int, data.manufacture_year);
    request.input("chassis_number", sql.VarChar(100), data.chassis_number);
    request.input("engine_number", sql.VarChar(100), data.engine_number);

    const result = await request.query(`
        UPDATE v
        SET
            v.plate_number = @plate_number,
            v.brand = @brand,
            v.model = @model,
            v.color = @color,
            v.manufacture_year = @manufacture_year,
            v.chassis_number = @chassis_number,
            v.engine_number = @engine_number
        OUTPUT
            INSERTED.id,
            INSERTED.plate_number,
            INSERTED.type,
            INSERTED.brand,
            INSERTED.model,
            INSERTED.color,
            INSERTED.manufacture_year,
            INSERTED.chassis_number,
            INSERTED.engine_number,
            INSERTED.verify_status,
            INSERTED.status,
            INSERTED.status_reason,
            INSERTED.created_at
        FROM vehicles v
        INNER JOIN vehicle_owners vo
            ON v.id = vo.vehicle_id
        WHERE v.id = @vehicle_id
          AND vo.user_id = @user_id
    `);

    return result.recordset[0] || null;
}

async function deleteVehicle(userId, vehicleId) {
    const pool = await require("../config/database").poolPromise;

    const request = pool.request();

    request.input("user_id", sql.VarChar(36), userId);
    request.input("vehicle_id", sql.VarChar(36), vehicleId);

    const result = await request.query(`
        UPDATE v
        SET
            v.status = 'INACTIVE',
            v.status_reason = 'REMOVED_BY_OWNER'
        OUTPUT
            INSERTED.id,
            INSERTED.plate_number,
            INSERTED.type,
            INSERTED.brand,
            INSERTED.model,
            INSERTED.status,
            INSERTED.status_reason
        FROM vehicles v
        INNER JOIN vehicle_owners vo
            ON v.id = vo.vehicle_id
        WHERE v.id = @vehicle_id
          AND vo.user_id = @user_id
          AND v.status = 'ACTIVE'
    `);

    return result.recordset[0] || null;
}

module.exports = {
    createVehicle,
    createVehicleOwner,
    findVehicleByPlate,
    getVehiclesByUser,
    getVehicleById,
    updateVehicle,
    deleteVehicle
};