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

async function manualCheckOut({ staffId, sessionId, paymentMethod }) {
  const { sql, poolPromise } = require("../config/database");
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  const paymentId = require("crypto").randomUUID();
  const logId = require("crypto").randomUUID();

  try {
    await transaction.begin();

    // 1. Kiểm tra nhân viên
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

    // 2. Khóa phiên gửi xe và lấy thông tin
    const sessionResult = await new sql.Request(transaction)
      .input("sessionId", sql.VarChar(36), sessionId)
      .query(`
        SELECT
          ps.id,
          ps.parking_lot_id,
          ps.slot_id,
          ps.vehicle_id,
          ps.guest_plate,
          ps.entry_time,
          ps.status,
          v.type AS vehicle_type,
          COALESCE(v.plate_number, ps.guest_plate) AS plate_number
        FROM parking_sessions ps WITH (UPDLOCK, HOLDLOCK)
        LEFT JOIN vehicles v ON v.id = ps.vehicle_id
        WHERE ps.id = @sessionId
      `);

    const session = sessionResult.recordset[0];

    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.status !== "ACTIVE") {
      throw new Error("SESSION_NOT_ACTIVE");
    }
    if (!session.plate_number) throw new Error("PLATE_NUMBER_NOT_FOUND");
    if (!session.vehicle_type) {
      throw new Error("VEHICLE_TYPE_UNKNOWN");
    }

    // 3. Lấy bảng giá
    const pricingResult = await new sql.Request(transaction)
      .input("parkingLotId", sql.VarChar(36), session.parking_lot_id)
      .input("vehicleType", sql.VarChar(20), session.vehicle_type)
      .query(`
        SELECT TOP 1
          first_hour_fee,
          next_hour_fee,
          max_daily_fee
        FROM pricing_rules
        WHERE parking_lot_id = @parkingLotId
          AND vehicle_type = @vehicleType
      `);

    const pricing = pricingResult.recordset[0];
    if (!pricing) throw new Error("PRICING_RULE_NOT_FOUND");

    // 4. Tính phí theo giờ, làm tròn lên mỗi giờ.
    // Phí ngày được giới hạn bởi max_daily_fee.
    const entryTime = new Date(session.entry_time);
    const exitTime = new Date();

    const elapsedMs = Math.max(0, exitTime - entryTime);
    const hours = Math.max(1, Math.ceil(elapsedMs / (60 * 60 * 1000)));

    const firstHourFee = Number(pricing.first_hour_fee);
    const nextHourFee = Number(pricing.next_hour_fee);
    const maxDailyFee = Number(pricing.max_daily_fee);

    if (
      !Number.isFinite(firstHourFee) ||
      !Number.isFinite(nextHourFee) ||
      !Number.isFinite(maxDailyFee) ||
      firstHourFee < 0 ||
      nextHourFee < 0 ||
      maxDailyFee < 0
    ) {
      throw new Error("INVALID_PRICING_RULE");
    }

    const feePerPeriod =
      firstHourFee + Math.max(0, hours - 1) * nextHourFee;

    const totalFee = Math.min(
      feePerPeriod,
      Math.max(1, Math.ceil(hours / 24)) * maxDailyFee
    );

    // 5. Tạo thanh toán tiền mặt và đánh dấu đã thanh toán
    await new sql.Request(transaction)
      .input("paymentId", sql.VarChar(36), paymentId)
      .input("staffId", sql.VarChar(36), staffId)
      .input("sessionId", sql.VarChar(36), sessionId)
      .input("amount", sql.Decimal(10, 2), totalFee)
      .input("paymentMethod", sql.VarChar(50), paymentMethod)
      .query(`
        INSERT INTO payments (
          id, user_id, type, amount, status, method, session_id
        )
        VALUES (
          @paymentId, @staffId, 'GUEST_PARKING',
          @amount, 'PAID', @paymentMethod, @sessionId
        )
      `);

    // 6. Hoàn tất phiên gửi xe
    await new sql.Request(transaction)
      .input("sessionId", sql.VarChar(36), sessionId)
      .input("totalFee", sql.Decimal(10, 2), totalFee)
      .query(`
        UPDATE parking_sessions
        SET exit_time = SYSDATETIME(),
            total_fee = @totalFee,
            status = 'COMPLETED'
        WHERE id = @sessionId
          AND status = 'ACTIVE'
      `);

    // 7. Giải phóng chỗ đỗ
    if (session.slot_id) {
      await new sql.Request(transaction)
        .input("slotId", sql.VarChar(36), session.slot_id)
        .query(`
          UPDATE parking_slots
          SET status = 'AVAILABLE'
          WHERE id = @slotId
            AND status = 'OCCUPIED'
        `);
    }

    // 8. Ghi access log
    await new sql.Request(transaction)
      .input("logId", sql.VarChar(36), logId)
      .input("staffId", sql.VarChar(36), staffId)
      .input("plateNumber", sql.VarChar(20), session.plate_number)
      .query(`
        INSERT INTO access_logs (
          id, user_id, plate_number, direction,
          method, result, reason, timestamp
        )
        VALUES (
          @logId, @staffId, @plateNumber, 'CHECK_OUT',
          'MANUAL_ENTRY', 'ALLOW',
          N'Nhân viên check-out thủ công',
          SYSDATETIME()
        )
      `);

    await transaction.commit();

    return {
      session_id: sessionId,
      plate_number: session.plate_number,
      entry_time: session.entry_time,
      exit_time: exitTime.toISOString(),
      duration_hours: hours,
      total_fee: totalFee,
      payment_id: paymentId,
      payment_method: paymentMethod,
      payment_status: "PAID",
      status: "COMPLETED",
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_) {}

    throw error;
  }
}

// Thêm vào src/repositories/staff.repository.js

const getActiveParkingSessions = async (parkingLotId = null) => {
  const { poolPromise, sql } = require("../config/database");
  const pool = await poolPromise;

  const request = pool.request();

  request.input("parking_lot_id", sql.VarChar(36), parkingLotId);

  const result = await request.query(`
    SELECT
      ps.id AS session_id,
      ps.parking_lot_id,
      pl.name AS parking_lot_name,
      ps.vehicle_id,
      COALESCE(v.plate_number, ps.guest_plate) AS plate_number,
      COALESCE(v.type, pa.vehicle_type) AS vehicle_type,
      pa.name AS area_name,
      sl.code AS slot_code,
      ps.entry_time,
      DATEDIFF(MINUTE, ps.entry_time, GETDATE()) AS duration_minutes,
      ps.access_method,
      ps.status
    FROM parking_sessions ps
    INNER JOIN parking_lots pl
      ON pl.id = ps.parking_lot_id
    LEFT JOIN vehicles v
      ON v.id = ps.vehicle_id
    LEFT JOIN parking_slots sl
      ON sl.id = ps.slot_id
    LEFT JOIN parking_areas pa
      ON pa.id = sl.parking_area_id
    WHERE ps.status = 'ACTIVE'
      AND (
        @parking_lot_id IS NULL
        OR ps.parking_lot_id = @parking_lot_id
      )
    ORDER BY ps.entry_time DESC;
  `);

  return result.recordset;
};

module.exports = {
    getPendingVehicles,
    getVehicleForReview,
    startVehicleReview,
    decideVehicleVerification,
    getVehicleVerificationLogs,
    getAllVehicleVerificationLogs,
    manualCheckIn,
    manualCheckOut,
    getActiveParkingSessions
};
