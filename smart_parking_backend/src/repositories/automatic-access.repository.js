const { sql, poolPromise } = require("../config/database");

async function checkIn({ parking_lot_id, method, plate_number, secure_token }) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Kiểm tra bãi xe
    const lotRequest = new sql.Request(transaction);
    const lotResult = await lotRequest
      .input("lotId", sql.VarChar(36), parking_lot_id)
      .query(`
        SELECT id, status
        FROM parking_lots
        WHERE id = @lotId
      `);

    if (!lotResult.recordset.length ||
        lotResult.recordset[0].status !== "ACTIVE") {
      throw new Error("PARKING_LOT_UNAVAILABLE");
    }

    // 2. Nhận diện phương tiện
    const vehicleRequest = new sql.Request(transaction);
    let vehicleResult;

    if (method === "LICENSE_PLATE") {
      vehicleResult = await vehicleRequest
        .input("plate", sql.VarChar(20), plate_number)
        .query(`
          SELECT id, plate_number, type, status, verify_status
          FROM vehicles WITH (UPDLOCK, HOLDLOCK)
          WHERE plate_number = @plate
        `);
    } else {
      vehicleResult = await vehicleRequest
        .input("token", sql.VarChar(255), secure_token)
        .input("credentialType", sql.VarChar(20), method)
        .query(`
          SELECT v.id, v.plate_number, v.type, v.status,
                 v.verify_status, c.status AS credential_status,
                 c.expired_at, c.type AS credential_type
          FROM credentials c
          JOIN vehicles v ON v.id = c.vehicle_id
          WHERE c.secure_token = @token
            AND c.type = @credentialType
        `);
    }

    const vehicle = vehicleResult.recordset[0];

    if (!vehicle) {
      throw new Error("VEHICLE_NOT_FOUND");
    }

    if (vehicle.status !== "ACTIVE") {
      throw new Error("VEHICLE_NOT_ACTIVE");
    }

    if (vehicle.verify_status !== "VERIFIED") {
      throw new Error("VEHICLE_NOT_VERIFIED");
    }

    // QR/Barcode phải còn hiệu lực
    if (method !== "LICENSE_PLATE") {
      if (
        vehicle.credential_status !== "ACTIVE" ||
        (vehicle.expired_at &&
          new Date(vehicle.expired_at) <= new Date())
      ) {
        throw new Error("CREDENTIAL_INVALID");
      }
    }

    // 3. Kiểm tra SmartPass đang hoạt động
    const passRequest = new sql.Request(transaction);
    const passResult = await passRequest
      .input("vehicleId", sql.VarChar(36), vehicle.id)
      .query(`
        SELECT TOP 1 id
        FROM smart_passes
        WHERE vehicle_id = @vehicleId
          AND status = 'ACTIVE'
          AND (
            credential_id IS NULL
            OR credential_id IN (
              SELECT id FROM credentials
              WHERE status = 'ACTIVE'
                AND (expired_at IS NULL OR expired_at > GETDATE())
            )
          )
      `);

    if (!passResult.recordset.length) {
      throw new Error("SMARTPASS_INACTIVE");
    }

    // 4. Không cho xe có nhiều phiên gửi xe đang hoạt động
    const sessionRequest = new sql.Request(transaction);
    const activeResult = await sessionRequest
      .input("vehicleId", sql.VarChar(36), vehicle.id)
      .query(`
        SELECT id
        FROM parking_sessions WITH (UPDLOCK, HOLDLOCK)
        WHERE vehicle_id = @vehicleId
          AND status = 'ACTIVE'
      `);

    if (activeResult.recordset.length) {
      throw new Error("SESSION_ALREADY_ACTIVE");
    }

    // 5. Tìm chỗ trống đúng loại xe
    const slotRequest = new sql.Request(transaction);
    const slotResult = await slotRequest
      .input("lotId", sql.VarChar(36), parking_lot_id)
      .input("vehicleType", sql.VarChar(20), vehicle.type)
      .query(`
        SELECT TOP 1 s.id
        FROM parking_slots s WITH (UPDLOCK, ROWLOCK)
        JOIN parking_areas a ON a.id = s.parking_area_id
        WHERE a.parking_lot_id = @lotId
          AND a.vehicle_type = @vehicleType
          AND s.status = 'AVAILABLE'
        ORDER BY s.code
      `);

    if (!slotResult.recordset.length) {
      throw new Error("NO_AVAILABLE_SLOT");
    }

    const slotId = slotResult.recordset[0].id;

    // 6. Tạo phiên gửi xe
    const insertRequest = new sql.Request(transaction);
    const insertResult = await insertRequest
      .input("lotId", sql.VarChar(36), parking_lot_id)
      .input("slotId", sql.VarChar(36), slotId)
      .input("vehicleId", sql.VarChar(36), vehicle.id)
      .input("method", sql.VarChar(20), method)
      .query(`
        INSERT INTO parking_sessions (
          parking_lot_id, slot_id, vehicle_id,
          access_method, status
        )
        OUTPUT INSERTED.id, INSERTED.vehicle_id,
               INSERTED.slot_id, INSERTED.entry_time,
               INSERTED.status, INSERTED.access_method
        VALUES (
          @lotId, @slotId, @vehicleId,
          @method, 'ACTIVE'
        )
      `);

    const session = insertResult.recordset[0];

    // 7. Chiếm chỗ
    const updateSlotRequest = new sql.Request(transaction);
    await updateSlotRequest
      .input("slotId", sql.VarChar(36), slotId)
      .query(`
        UPDATE parking_slots
        SET status = 'OCCUPIED'
        WHERE id = @slotId
          AND status = 'AVAILABLE'
      `);

    // 8. Ghi log cho lượt vào
    const logRequest = new sql.Request(transaction);
    const ownerResult = await logRequest
      .input("vehicleId", sql.VarChar(36), vehicle.id)
      .query(`
        SELECT TOP 1 user_id
        FROM vehicle_owners
        WHERE vehicle_id = @vehicleId
        ORDER BY CASE WHEN driver_role = 'OWNER' THEN 0 ELSE 1 END
      `);

    const userId = ownerResult.recordset[0]?.user_id || null;

    const accessLogRequest = new sql.Request(transaction);
    await accessLogRequest
      .input("userId", sql.VarChar(36), userId)
      .input("plate", sql.VarChar(20), vehicle.plate_number)
      .input("method", sql.VarChar(20), method)
      .query(`
        INSERT INTO access_logs (
          user_id, plate_number, direction, method, result, reason
        )
        VALUES (
          @userId, @plate, 'CHECK_IN', @method, 'ALLOW', NULL
        )
      `);

    await transaction.commit();

    return {
      session,
      vehicle: {
        id: vehicle.id,
        plate_number: vehicle.plate_number,
        type: vehicle.type
      }
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_) {}

    throw error;
  }
}


async function checkOut({
  method,
  plate_number,
  secure_token,
  payment_method
}) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Tìm phiên gửi xe đang hoạt động
    const request = new sql.Request(transaction);

    let sessionResult;

    if (method === "LICENSE_PLATE") {
      sessionResult = await request
        .input("plate", sql.VarChar(20), plate_number)
        .query(`
          SELECT TOP 1
            ps.id AS session_id,
            ps.parking_lot_id,
            ps.slot_id,
            ps.vehicle_id,
            ps.guest_plate,
            ps.entry_time,
            ps.access_method,
            v.plate_number,
            v.type AS vehicle_type,
            v.status AS vehicle_status,
            v.verify_status,
            (
              SELECT TOP 1 sp.status
              FROM smart_passes sp
              WHERE sp.vehicle_id = v.id
              ORDER BY sp.created_at DESC
            ) AS smartpass_status,
            (
              SELECT TOP 1 vo.user_id
              FROM vehicle_owners vo
              WHERE vo.vehicle_id = v.id
              ORDER BY CASE WHEN vo.driver_role = 'OWNER'
                            THEN 0 ELSE 1 END
            ) AS user_id
          FROM parking_sessions ps WITH (UPDLOCK, HOLDLOCK)
          LEFT JOIN vehicles v ON v.id = ps.vehicle_id
          WHERE ps.status = 'ACTIVE'
            AND (
              v.plate_number = @plate
              OR ps.guest_plate = @plate
            )
          ORDER BY ps.entry_time DESC
        `);
    } else {
      sessionResult = await request
        .input("token", sql.VarChar(255), secure_token)
        .input("credentialType", sql.VarChar(20), method)
        .query(`
          SELECT TOP 1
            ps.id AS session_id,
            ps.parking_lot_id,
            ps.slot_id,
            ps.vehicle_id,
            ps.guest_plate,
            ps.entry_time,
            ps.access_method,
            v.plate_number,
            v.type AS vehicle_type,
            v.status AS vehicle_status,
            v.verify_status,
            c.status AS credential_status,
            c.expired_at,
            (
              SELECT TOP 1 sp.status
              FROM smart_passes sp
              WHERE sp.vehicle_id = v.id
              ORDER BY sp.created_at DESC
            ) AS smartpass_status,
            (
              SELECT TOP 1 vo.user_id
              FROM vehicle_owners vo
              WHERE vo.vehicle_id = v.id
              ORDER BY CASE WHEN vo.driver_role = 'OWNER'
                            THEN 0 ELSE 1 END
            ) AS user_id
          FROM credentials c
          JOIN vehicles v ON v.id = c.vehicle_id
          JOIN parking_sessions ps ON ps.vehicle_id = v.id
          WHERE c.secure_token = @token
            AND c.type = @credentialType
            AND ps.status = 'ACTIVE'
          ORDER BY ps.entry_time DESC
        `);
    }

    const session = sessionResult.recordset[0];

    if (!session) {
      throw new Error("ACTIVE_SESSION_NOT_FOUND");
    }

    // 2. Với xe đăng ký, kiểm tra trạng thái hiện tại.
    // Xe bị tạm ngưng vẫn cần được phép checkout để rời bãi.
    if (session.vehicle_id) {
      if (session.vehicle_status !== "ACTIVE") {
        throw new Error("VEHICLE_NOT_ACTIVE");
      }

      if (session.verify_status !== "VERIFIED") {
        throw new Error("VEHICLE_NOT_VERIFIED");
      }

      if (
        method !== "LICENSE_PLATE" &&
        (
          session.credential_status !== "ACTIVE" ||
          (
            session.expired_at &&
            new Date(session.expired_at) <= new Date()
          )
        )
      ) {
        throw new Error("CREDENTIAL_INVALID");
      }
    }

    // 3. Tính thời gian gửi và lấy bảng giá
    const pricingRequest = new sql.Request(transaction);

    const pricingResult = await pricingRequest
      .input("lotId", sql.VarChar(36), session.parking_lot_id)
      .input("vehicleType", sql.VarChar(20), session.vehicle_type)
      .query(`
        SELECT TOP 1 first_hour_fee, next_hour_fee, max_daily_fee
        FROM pricing_rules
        WHERE parking_lot_id = @lotId
          AND vehicle_type = @vehicleType
      `);

    if (!pricingResult.recordset.length) {
      throw new Error("PRICING_RULE_NOT_FOUND");
    }

    const pricing = pricingResult.recordset[0];

    const timeResult = await new sql.Request(transaction)
      .input("sessionId", sql.VarChar(36), session.session_id)
      .query(`
        SELECT DATEDIFF(
          MINUTE, entry_time, GETDATE()
        ) AS duration_minutes
        FROM parking_sessions
        WHERE id = @sessionId
      `);

    const durationMinutes = Math.max(
      0,
      timeResult.recordset[0].duration_minutes
    );

    const hours = Math.max(1, Math.ceil(durationMinutes / 60));
    const days = Math.max(1, Math.ceil(hours / 24));

    const rawFee =
      Number(pricing.first_hour_fee) +
      Math.max(0, hours - 1) * Number(pricing.next_hour_fee);

    const totalFee = Math.min(
      rawFee,
      days * Number(pricing.max_daily_fee)
    );

    // 4. Kết thúc phiên gửi xe
    const finishResult = await new sql.Request(transaction)
      .input("sessionId", sql.VarChar(36), session.session_id)
      .input("totalFee", sql.Decimal(10, 2), totalFee)
      .query(`
        UPDATE parking_sessions
        SET exit_time = GETDATE(),
            total_fee = @totalFee,
            status = 'COMPLETED'
        WHERE id = @sessionId
          AND status = 'ACTIVE';

        SELECT @@ROWCOUNT AS affected;
      `);

    if (finishResult.recordset[0].affected !== 1) {
      throw new Error("SESSION_ALREADY_COMPLETED");
    }

    // 5. Giải phóng chỗ đỗ
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
    // 6. Kiểm tra payment của session
    const existingPaymentResult = await new sql.Request(transaction)
    .input("sessionId", sql.VarChar(36), session.session_id)
    .query(`
        SELECT TOP 1
        id, amount, status, method
        FROM payments WITH (UPDLOCK, HOLDLOCK)
        WHERE session_id = @sessionId
    `);

    let payment;

    if (existingPaymentResult.recordset.length > 0) {
    // Session đã có payment từ checkout thủ công hoặc lần xử lý trước
    payment = existingPaymentResult.recordset[0];
    } else {
    // Tạo payment mới, không truyền NULL vào các cột UNIQUE khác
    const paymentResult = await new sql.Request(transaction)
        .input("userId", sql.VarChar(36), session.user_id || null)
        .input(
        "paymentType",
        sql.VarChar(20),
        session.vehicle_id ? "SMART_PASS" : "GUEST_PARKING"
        )
        .input("amount", sql.Decimal(10, 2), totalFee)
        .input("paymentMethod", sql.VarChar(50), payment_method)
        .input("sessionId", sql.VarChar(36), session.session_id)
        .query(`
        INSERT INTO payments (
            user_id,
            type,
            amount,
            status,
            method,
            booking_id,
            subscription_id,
            session_id
        )
        OUTPUT
            INSERTED.id,
            INSERTED.amount,
            INSERTED.status,
            INSERTED.method
        VALUES (
            @userId,
            @paymentType,
            @amount,
            'PAID',
            @paymentMethod,
            NULL,
            NULL,
            @sessionId
        )
        `);

    payment = paymentResult.recordset[0];
    }

    // 7. Ghi access log
    const logMethod = [
      "LICENSE_PLATE", "QR_CODE", "BARCODE"
    ].includes(method) ? method : "LICENSE_PLATE";

    await new sql.Request(transaction)
      .input("userId", sql.VarChar(36), session.user_id || null)
      .input("plate", sql.VarChar(20),
        session.plate_number || session.guest_plate)
      .input("method", sql.VarChar(20), logMethod)
      .query(`
        INSERT INTO access_logs (
          user_id, plate_number, direction, method, result, reason
        )
        VALUES (
          @userId, @plate, 'CHECK_OUT', @method, 'ALLOW', NULL
        )
      `);

    await transaction.commit();

    return {
      session_id: session.session_id,
      plate_number: session.plate_number || session.guest_plate,
      duration_minutes: durationMinutes,
      total_fee: totalFee,
      payment: paymentResult.recordset[0],
      status: "COMPLETED"
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_) {}

    throw error;
  }
}

module.exports = { checkIn, checkOut };
