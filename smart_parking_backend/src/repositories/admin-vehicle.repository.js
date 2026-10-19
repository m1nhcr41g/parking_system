const { sql, poolPromise } = require("../config/database");

async function updateVehicleStatus(vehicleId, status, statusReason, adminId) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const request = new sql.Request(transaction);

    // Kiểm tra tài khoản Admin
    const adminResult = await request
      .input("adminId", sql.VarChar(36), adminId)
      .query(`
        SELECT id
        FROM users
        WHERE id = @adminId
          AND role = 'ADMIN'
          AND status = 'ACTIVE'
      `);

    if (adminResult.recordset.length === 0) {
      throw new Error("ADMIN_NOT_FOUND");
    }

    // Kiểm tra xe tồn tại
    const vehicleResult = await request
      .input("vehicleId", sql.VarChar(36), vehicleId)
      .query(`
        SELECT id, plate_number, status, verify_status
        FROM vehicles
        WHERE id = @vehicleId
      `);

    if (vehicleResult.recordset.length === 0) {
      throw new Error("VEHICLE_NOT_FOUND");
    }

    // Cập nhật trạng thái xe
    const updateResult = await request
      .input("newStatus", sql.VarChar(20), status)
      .input("statusReason", sql.NVarChar(sql.MAX), statusReason)
      .query(`
        UPDATE vehicles
        SET status = @newStatus,
            status_reason = @statusReason
        WHERE id = @vehicleId;

        SELECT id, plate_number, type, status, status_reason, verify_status
        FROM vehicles
        WHERE id = @vehicleId;
      `);

    await transaction.commit();

    return updateResult.recordset[0];
  } catch (error) {
    if (transaction._aborted !== true) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }
    throw error;
  }
}

module.exports = { updateVehicleStatus };
