const { sql, poolPromise } = require("../config/database");

async function getVehicleById(userId, vehicleId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("user_id", sql.VarChar(36), userId)
        .input("vehicle_id", sql.VarChar(36), vehicleId)
        .query(`
            SELECT
                v.id,
                v.plate_number,
                v.type,
                v.verify_status,
                v.status
            FROM vehicles v
            INNER JOIN vehicle_owners vo
                ON vo.vehicle_id = v.id
            WHERE v.id = @vehicle_id
              AND vo.user_id = @user_id
        `);

    return result.recordset[0] || null;
}

async function createSmartPass(vehicleId, qrToken) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
        const request = new sql.Request(transaction);

        request.input("vehicle_id", sql.VarChar(36), vehicleId);
        request.input("qr_token", sql.VarChar(255), qrToken);

        const result = await request.query(`
            IF EXISTS (
                SELECT 1
                FROM smart_passes WITH (UPDLOCK, HOLDLOCK)
                WHERE vehicle_id = @vehicle_id
                  AND status = 'ACTIVE'
            )
            BEGIN
                THROW 50001, 'SMARTPASS_ALREADY_ACTIVE', 1;
            END;

            DECLARE @credential_id VARCHAR(36) = CONVERT(
                VARCHAR(36), NEWID()
            );

            DECLARE @smartpass_id VARCHAR(36) = CONVERT(
                VARCHAR(36), NEWID()
            );

            INSERT INTO credentials (
                id,
                vehicle_id,
                type,
                secure_token,
                status,
                issued_at
            )
            VALUES (
                @credential_id,
                @vehicle_id,
                'QR_CODE',
                @qr_token,
                'ACTIVE',
                GETDATE()
            );

            INSERT INTO smart_passes (
                id,
                vehicle_id,
                credential_id,
                status,
                auto_pay,
                created_at
            )
            VALUES (
                @smartpass_id,
                @vehicle_id,
                @credential_id,
                'ACTIVE',
                1,
                GETDATE()
            );

            SELECT
                sp.id AS smartpass_id,
                sp.vehicle_id,
                sp.credential_id,
                sp.status,
                sp.auto_pay,
                sp.created_at,
                c.type AS credential_type,
                c.secure_token AS qr_token,
                c.status AS credential_status
            FROM smart_passes sp
            INNER JOIN credentials c
                ON c.id = sp.credential_id
            WHERE sp.id = @smartpass_id;
        `);

        await transaction.commit();
        return result.recordset[0];
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function getSmartPassesByUser(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("user_id", sql.VarChar(36), userId)
        .query(`
            SELECT
                sp.id AS smartpass_id,
                sp.vehicle_id,
                v.plate_number,
                v.type AS vehicle_type,
                sp.credential_id,
                sp.status AS smartpass_status,
                sp.auto_pay,
                sp.created_at,
                c.type AS credential_type,
                c.secure_token AS qr_token,
                c.status AS credential_status,
                c.expired_at
            FROM smart_passes sp
            INNER JOIN vehicles v
                ON v.id = sp.vehicle_id
            INNER JOIN vehicle_owners vo
                ON vo.vehicle_id = v.id
            LEFT JOIN credentials c
                ON c.id = sp.credential_id
            WHERE vo.user_id = @user_id
            ORDER BY sp.created_at DESC
        `);

    return result.recordset;
}

module.exports = {
    getVehicleById,
    createSmartPass,
    getSmartPassesByUser
};