
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

const getCustomerAccessLogs = async ({
  user_id,
  direction,
  plate_number,
}) => {
  const { poolPromise, sql } = require("../config/database");
  const pool = await poolPromise;

  const request = pool.request();

  request.input("user_id", sql.VarChar(36), user_id);
  request.input("direction", sql.VarChar(20), direction || null);
  request.input("plate_number", sql.VarChar(20), plate_number || null);

  const result = await request.query(`
    SELECT
      al.id,
      al.plate_number,
      al.direction,
      al.method,
      al.result,
      al.reason,
      al.timestamp
    FROM access_logs al
    WHERE
      (
        al.user_id = @user_id
        OR EXISTS (
          SELECT 1
          FROM vehicle_owners vo
          INNER JOIN vehicles v
            ON v.id = vo.vehicle_id
          WHERE vo.user_id = @user_id
            AND v.plate_number = al.plate_number
        )
      )
      AND (
        @direction IS NULL
        OR al.direction = @direction
      )
      AND (
        @plate_number IS NULL
        OR al.plate_number = @plate_number
      )
    ORDER BY al.timestamp DESC;
  `);

  return result.recordset;
};

module.exports = {
    getAccessLogs,
    getCustomerAccessLogs
};
