
const crypto = require("crypto");
const { sql, poolPromise } = require("../config/database");

async function getAllCredentials() {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT
            c.id,
            c.vehicle_id,
            v.plate_number,
            v.type AS vehicle_type,
            c.type AS credential_type,
            c.status,
            c.issued_at,
            c.expired_at,
            sp.id AS smartpass_id,
            sp.status AS smartpass_status
        FROM dbo.credentials c
        INNER JOIN dbo.vehicles v
            ON v.id = c.vehicle_id
        LEFT JOIN dbo.smart_passes sp
            ON sp.credential_id = c.id
        ORDER BY c.issued_at DESC;
    `);

    return result.recordset;
}

async function reissueCredential(vehicleId) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
        const check = await new sql.Request(transaction)
            .input("vehicleId", sql.VarChar(36), vehicleId)
            .query(`
                SELECT
                    v.id,
                    v.plate_number,
                    v.verify_status,
                    v.status,
                    sp.id AS smartpass_id,
                    sp.status AS smartpass_status,
                    sp.credential_id
                FROM dbo.vehicles v
                INNER JOIN dbo.smart_passes sp
                    ON sp.vehicle_id = v.id
                WHERE v.id = @vehicleId
                  AND sp.status = 'ACTIVE';
            `);

        const record = check.recordset[0];

        if (!record) {
            const error = new Error(
                "Không tìm thấy SmartPass đang hoạt động cho phương tiện"
            );
            error.statusCode = 404;
            error.code = "ACTIVE_SMARTPASS_NOT_FOUND";
            throw error;
        }

        if (
            record.status !== "ACTIVE" ||
            record.verify_status !== "VERIFIED"
        ) {
            const error = new Error(
                "Phương tiện phải ACTIVE và VERIFIED mới được cấp lại mã"
            );
            error.statusCode = 400;
            error.code = "VEHICLE_NOT_ELIGIBLE";
            throw error;
        }

        const newToken = crypto.randomBytes(32).toString("hex");

        if (record.credential_id) {
            await new sql.Request(transaction)
                .input("credentialId", sql.VarChar(36), record.credential_id)
                .query(`
                    UPDATE dbo.credentials
                    SET status = 'REVOKED'
                    WHERE id = @credentialId
                      AND status = 'ACTIVE';
                `);
        }
            
        const newCredential = await new sql.Request(transaction)
            .input("vehicleId", sql.VarChar(36), vehicleId)
            .input("smartpassId", sql.VarChar(36), record.smartpass_id)
            .input("token", sql.VarChar(255), newToken)
            .input("type", sql.VarChar(20), "QR_CODE")
            .query(`
                DECLARE @newId VARCHAR(36) = CONVERT(VARCHAR(36), NEWID());

                INSERT INTO dbo.credentials (
                    id, vehicle_id, type, secure_token,
                    status, issued_at, expired_at
                )
                VALUES (
                    @newId, @vehicleId, @type, @token,
                    'ACTIVE', GETDATE(), NULL
                );

                UPDATE dbo.smart_passes
                SET credential_id = @newId
                WHERE id = @smartpassId;

                SELECT
                    @newId AS credential_id,
                    @token AS secure_token,
                    @vehicleId AS vehicle_id,
                    @type AS credential_type,
                    'ACTIVE' AS status,
                    GETDATE() AS issued_at;
            `);


        await transaction.commit();
        return newCredential.recordset[0];
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports = {
    getAllCredentials,
    reissueCredential
};
