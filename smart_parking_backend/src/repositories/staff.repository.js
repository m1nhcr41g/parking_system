const { sql, poolPromise } = require("../config/database");
const crypto = require("crypto");

async function getPendingVehicles() {
    const pool = await poolPromise;

    const result = await pool.request().query(`
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
            vo.user_id,
            rd.id AS document_id,
            rd.document_type,
            rd.document_number,
            rd.owner_name,
            rd.file_url
        FROM dbo.vehicles v
        LEFT JOIN dbo.vehicle_owners vo
            ON vo.vehicle_id = v.id
            AND vo.driver_role = 'OWNER'
        LEFT JOIN dbo.registration_documents rd
            ON rd.vehicle_id = v.id
        WHERE v.verify_status = 'PENDING'
          AND v.status = 'ACTIVE'
        ORDER BY v.created_at ASC;
    `);

    return result.recordset;
}


async function getVehicleForReview(vehicleId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("vehicleId", sql.VarChar(36), vehicleId)
        .query(`
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
                vo.user_id,
                vo.driver_role,
                rd.id AS document_id,
                rd.document_type,
                rd.document_number,
                rd.owner_name,
                rd.registration_date,
                rd.issuing_authority,
                rd.file_url
            FROM dbo.vehicles v
            LEFT JOIN dbo.vehicle_owners vo
                ON vo.vehicle_id = v.id
                AND vo.driver_role = 'OWNER'
            LEFT JOIN dbo.registration_documents rd
                ON rd.vehicle_id = v.id
            WHERE v.id = @vehicleId;
        `);

    return result.recordset[0] || null;
}

async function startVehicleReview(vehicleId, reviewerId) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
        const request = new sql.Request(transaction);

        const result = await request
            .input("vehicleId", sql.VarChar(36), vehicleId)
            .input("reviewerId", sql.VarChar(36), reviewerId)
            .query(`
                SELECT id, verify_status, status
                FROM dbo.vehicles WITH (UPDLOCK, HOLDLOCK)
                WHERE id = @vehicleId;
            `);

        const vehicle = result.recordset[0];

        if (!vehicle) {
            const error = new Error("Không tìm thấy phương tiện");
            error.statusCode = 404;
            error.code = "VEHICLE_NOT_FOUND";
            throw error;
        }

        if (vehicle.status !== "ACTIVE") {
            const error = new Error("Phương tiện không hoạt động");
            error.statusCode = 400;
            error.code = "VEHICLE_INACTIVE";
            throw error;
        }

        if (vehicle.verify_status !== "PENDING") {
            const error = new Error(
                "Chỉ tiếp nhận phương tiện đang chờ xác minh"
            );
            error.statusCode = 409;
            error.code = "INVALID_VERIFICATION_STATUS";
            throw error;
        }

        await new sql.Request(transaction)
            .input("vehicleId", sql.VarChar(36), vehicleId)
            .query(`
                UPDATE dbo.vehicles
                SET verify_status = 'UNDER_REVIEW'
                WHERE id = @vehicleId;
            `);

        await new sql.Request(transaction)
            .input("vehicleId", sql.VarChar(36), vehicleId)
            .input("reviewerId", sql.VarChar(36), reviewerId)
            .input("status", sql.VarChar(20), "UNDER_REVIEW")
            .input("decision", sql.NVarChar(50), "START_REVIEW")
            .input("reason", sql.NVarChar(sql.MAX), "Staff tiếp nhận hồ sơ")
            .query(`
                INSERT INTO dbo.verification_logs
                    (vehicle_id, reviewer_id, status, decision, reason)
                VALUES
                    (@vehicleId, @reviewerId, @status, @decision, @reason);
            `);

        await transaction.commit();

        return { vehicleId, verify_status: "UNDER_REVIEW" };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function decideVehicleVerification(
    vehicleId,
    reviewerId,
    decision,
    reason
) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
        const request = new sql.Request(transaction);

        const result = await request
            .input("vehicleId", sql.VarChar(36), vehicleId)
            .input("reviewerId", sql.VarChar(36), reviewerId)
            .query(`
                SELECT id, verify_status, status
                FROM dbo.vehicles WITH (UPDLOCK, HOLDLOCK)
                WHERE id = @vehicleId;
            `);

        const vehicle = result.recordset[0];

        if (!vehicle) {
            const error = new Error("Không tìm thấy phương tiện");
            error.statusCode = 404;
            error.code = "VEHICLE_NOT_FOUND";
            throw error;
        }

        if (vehicle.status !== "ACTIVE") {
            const error = new Error("Phương tiện không hoạt động");
            error.statusCode = 400;
            error.code = "VEHICLE_INACTIVE";
            throw error;
        }

        if (vehicle.verify_status !== "UNDER_REVIEW") {
            const error = new Error(
                "Phương tiện chưa được tiếp nhận xác minh"
            );
            error.statusCode = 409;
            error.code = "INVALID_VERIFICATION_STATUS";
            throw error;
        }

        await new sql.Request(transaction)
            .input("vehicleId", sql.VarChar(36), vehicleId)
            .input("decision", sql.VarChar(20), decision)
            .query(`
                UPDATE dbo.vehicles
                SET verify_status = @decision
                WHERE id = @vehicleId;
            `);

        await new sql.Request(transaction)
            .input("vehicleId", sql.VarChar(36), vehicleId)
            .input("reviewerId", sql.VarChar(36), reviewerId)
            .input("status", sql.VarChar(20), decision)
            .input("decision", sql.NVarChar(50), decision)
            .input("reason", sql.NVarChar(sql.MAX), reason || null)
            .query(`
                INSERT INTO dbo.verification_logs
                    (vehicle_id, reviewer_id, status, decision, reason)
                VALUES
                    (@vehicleId, @reviewerId, @status, @decision, @reason);
            `);

        await transaction.commit();

        return {
            vehicleId,
            verify_status: decision,
            reason: reason || null
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}


async function getVehicleVerificationLogs(vehicleId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("vehicleId", sql.VarChar(36), vehicleId)
        .query(`
            SELECT
                vl.id,
                vl.vehicle_id,
                vl.reviewer_id,
                u.full_name AS reviewer_name,
                vl.status,
                vl.decision,
                vl.reason,
                vl.created_at
            FROM dbo.verification_logs vl
            LEFT JOIN dbo.users u
                ON u.id = vl.reviewer_id
            WHERE vl.vehicle_id = @vehicleId
            ORDER BY vl.created_at DESC;
        `);

    return result.recordset;
}


async function getAllVehicleVerificationLogs() {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT
            vl.id,
            vl.vehicle_id,
            v.plate_number,
            vl.reviewer_id,
            u.full_name AS reviewer_name,
            vl.status,
            vl.decision,
            vl.reason,
            vl.created_at
        FROM dbo.verification_logs vl
        INNER JOIN dbo.vehicles v
            ON v.id = vl.vehicle_id
        LEFT JOIN dbo.users u
            ON u.id = vl.reviewer_id
        ORDER BY vl.created_at DESC;
    `);

    return result.recordset;
}

async function manualCheckIn({
  staffId,
  parkingLotId,
  vehicleId,
  guestPlate,
  vehicleType,
}) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  const sessionId = crypto.randomUUID();
  const logId = crypto.randomUUID();

  try {
    await transaction.begin();

    // 1. Kiểm tra nhân viên tồn tại và đang hoạt động
    const staffResult = await new sql.Request(transaction)
      .input("staffId", sql.VarChar(36), staffId)
      .query(`
        SELECT id
        FROM users
        WHERE id = @staffId
          AND role = 'STAFF'
          AND status = 'ACTIVE'
      `);

    if (staffResult.recordset.length === 0) {
      throw new Error("STAFF_NOT_FOUND");
    }

    // 2. Khóa và kiểm tra bãi xe
    const lotResult = await new sql.Request(transaction)
      .input("parkingLotId", sql.VarChar(36), parkingLotId)
      .query(`
        SELECT id
        FROM parking_lots WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @parkingLotId
          AND status = 'ACTIVE'
      `);

    if (lotResult.recordset.length === 0) {
      throw new Error("PARKING_LOT_NOT_ACTIVE");
    }

    let plateNumber = guestPlate || null;
    let resolvedVehicleType = vehicleType || null;

    // 3. Nếu xe đã đăng ký, kiểm tra phương tiện
    if (vehicleId) {
      const vehicleResult = await new sql.Request(transaction)
        .input("vehicleId", sql.VarChar(36), vehicleId)
        .query(`
          SELECT id, plate_number, type, status, verify_status
          FROM vehicles
          WHERE id = @vehicleId
        `);

      const vehicle = vehicleResult.recordset[0];

      if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
      }

      if (
        vehicle.status !== "ACTIVE" ||
        vehicle.verify_status !== "VERIFIED"
      ) {
        throw new Error("VEHICLE_NOT_ELIGIBLE");
      }

      plateNumber = vehicle.plate_number;
      resolvedVehicleType = vehicle.type;
    }

    if (!plateNumber) {
      throw new Error("PLATE_NUMBER_REQUIRED");
    }

    if (!resolvedVehicleType) {
      throw new Error("VEHICLE_TYPE_REQUIRED");
    }

    // 4. Không cho phép một xe có nhiều phiên đang hoạt động
    const activeSession = await new sql.Request(transaction)
      .input("vehicleId", sql.VarChar(36), vehicleId || null)
      .input("guestPlate", sql.VarChar(20), plateNumber)
      .query(`
        SELECT TOP 1 id
        FROM parking_sessions WITH (UPDLOCK, HOLDLOCK)
        WHERE status = 'ACTIVE'
          AND (
            (@vehicleId IS NOT NULL AND vehicle_id = @vehicleId)
            OR guest_plate = @guestPlate
          )
      `);

    if (activeSession.recordset.length > 0) {
      throw new Error("VEHICLE_ALREADY_PARKED");
    }

    // 5. Chọn chỗ trống phù hợp và khóa chỗ đó
    const slotResult = await new sql.Request(transaction)
      .input("parkingLotId", sql.VarChar(36), parkingLotId)
      .input("vehicleType", sql.VarChar(20), resolvedVehicleType)
      .query(`
        SELECT TOP 1
          ps.id AS slot_id
        FROM parking_slots ps WITH (UPDLOCK, ROWLOCK)
        INNER JOIN parking_areas pa
          ON pa.id = ps.parking_area_id
        WHERE pa.parking_lot_id = @parkingLotId
          AND pa.vehicle_type = @vehicleType
          AND ps.status = 'AVAILABLE'
        ORDER BY ps.id
      `);

    if (slotResult.recordset.length === 0) {
      throw new Error("NO_AVAILABLE_SLOT");
    }

    const slotId = slotResult.recordset[0].slot_id;

    // 6. Tạo phiên gửi xe
    await new sql.Request(transaction)
      .input("sessionId", sql.VarChar(36), sessionId)
      .input("parkingLotId", sql.VarChar(36), parkingLotId)
      .input("slotId", sql.VarChar(36), slotId)
      .input("vehicleId", sql.VarChar(36), vehicleId || null)
      .input("guestPlate", sql.VarChar(20), vehicleId ? null : plateNumber)
      .query(`
        INSERT INTO parking_sessions (
          id,
          parking_lot_id,
          slot_id,
          vehicle_id,
          guest_plate,
          entry_time,
          total_fee,
          access_method,
          status
        )
        VALUES (
          @sessionId,
          @parkingLotId,
          @slotId,
          @vehicleId,
          @guestPlate,
          SYSDATETIME(),
          0,
          'MANUAL_ENTRY',
          'ACTIVE'
        )
      `);

    // 7. Cập nhật chỗ đỗ
    const updateSlot = await new sql.Request(transaction)
      .input("slotId", sql.VarChar(36), slotId)
      .query(`
        UPDATE parking_slots
        SET status = 'OCCUPIED'
        WHERE id = @slotId
          AND status = 'AVAILABLE'
      `);

    if (updateSlot.rowsAffected[0] !== 1) {
      throw new Error("SLOT_NO_LONGER_AVAILABLE");
    }

    // 8. Ghi nhật ký check-in
    await new sql.Request(transaction)
      .input("logId", sql.VarChar(36), logId)
      .input("staffId", sql.VarChar(36), staffId)
      .input("plateNumber", sql.VarChar(20), plateNumber)
      .query(`
        INSERT INTO access_logs (
          id,
          user_id,
          plate_number,
          direction,
          method,
          result,
          reason,
          timestamp
        )
        VALUES (
          @logId,
          @staffId,
          @plateNumber,
          'CHECK_IN',
          'MANUAL_ENTRY',
          'ALLOW',
          N'Nhân viên check-in thủ công',
          SYSDATETIME()
        )
      `);

    await transaction.commit();

    return {
      session_id: sessionId,
      parking_lot_id: parkingLotId,
      slot_id: slotId,
      vehicle_id: vehicleId || null,
      plate_number: plateNumber,
      entry_time: new Date().toISOString(),
      total_fee: 0,
      access_method: "MANUAL_ENTRY",
      status: "ACTIVE",
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_) {}

    throw error;
  }
}

module.exports = {
    getPendingVehicles,
    getVehicleForReview,
    startVehicleReview,
    decideVehicleVerification,
    getVehicleVerificationLogs,
    getAllVehicleVerificationLogs,
    manualCheckIn
};
