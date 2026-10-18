
const { poolPromise, sql } = require("../config/database");

async function getAccessLogs(filters = {}) {
    const pool = await poolPromise;
    const request = pool.request();

    let query = `
        SELECT
            id,
            user_id,
            plate_number,
            direction,
            method,
            result,
            reason,
            timestamp
        FROM access_logs
        WHERE 1 = 1
    `;

    if (filters.plate_number) {
        query += " AND plate_number = @plate_number";
        request.input("plate_number", sql.VarChar(20), filters.plate_number);
    }

    if (filters.direction) {
        query += " AND direction = @direction";
        request.input("direction", sql.VarChar(20), filters.direction);
    }

    query += " ORDER BY timestamp DESC";

    const result = await request.query(query);
    return result.recordset;
}

module.exports = {
    getAccessLogs
};
