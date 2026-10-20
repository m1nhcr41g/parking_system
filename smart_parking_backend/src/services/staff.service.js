const staffRepository = require("../repositories/staff.repository");

async function getPendingVehicles() {
    return await staffRepository.getPendingVehicles();
}

async function getVehicleForReview(vehicleId) {
    if (typeof vehicleId !== "string" || !vehicleId.trim()) {
        const error = new Error("ID phương tiện không hợp lệ");
        error.statusCode = 400;
        error.code = "INVALID_VEHICLE_ID";
        throw error;
    }

    return await staffRepository.getVehicleForReview(vehicleId);
}

async function startVehicleReview(vehicleId, reviewerId) {
    if (!vehicleId || !reviewerId) {
        const error = new Error("Thiếu vehicle_id hoặc reviewer_id");
        error.statusCode = 400;
        error.code = "MISSING_REQUIRED_FIELDS";
        throw error;
    }

    return staffRepository.startVehicleReview(vehicleId, reviewerId);
}

async function decideVehicleVerification(
    vehicleId,
    reviewerId,
    decision,
    reason
) {
    if (!vehicleId || !reviewerId || !decision) {
        const error = new Error(
            "Thiếu vehicle_id, reviewer_id hoặc decision"
        );
        error.statusCode = 400;
        error.code = "MISSING_REQUIRED_FIELDS";
        throw error;
    }

    if (!["VERIFIED", "REJECTED"].includes(decision)) {
        const error = new Error(
            "decision chỉ nhận VERIFIED hoặc REJECTED"
        );
        error.statusCode = 400;
        error.code = "INVALID_DECISION";
        throw error;
    }

    if (decision === "REJECTED" && !reason?.trim()) {
        const error = new Error("Phải cung cấp lý do từ chối");
        error.statusCode = 400;
        error.code = "REJECTION_REASON_REQUIRED";
        throw error;
    }

    return staffRepository.decideVehicleVerification(
        vehicleId,
        reviewerId,
        decision,
        reason
    );
}

async function getVehicleVerificationLogs(vehicleId) {
    if (typeof vehicleId !== "string" || !vehicleId.trim()) {
        const error = new Error("ID phương tiện không hợp lệ");
        error.statusCode = 400;
        error.code = "INVALID_VEHICLE_ID";
        throw error;
    }

    return staffRepository.getVehicleVerificationLogs(vehicleId);
}

async function getAllVehicleVerificationLogs() {
    return staffRepository.getAllVehicleVerificationLogs();
}

async function manualCheckIn(data) {
  const {
    staff_id,
    parking_lot_id,
    vehicle_id,
    guest_plate,
    vehicle_type,
  } = data;

  if (!staff_id || !parking_lot_id) {
    throw new Error("STAFF_AND_PARKING_LOT_REQUIRED");
  }

  if (!vehicle_id && !guest_plate) {
    throw new Error("VEHICLE_ID_OR_GUEST_PLATE_REQUIRED");
  }

  if (vehicle_id && guest_plate) {
    throw new Error("USE_VEHICLE_ID_OR_GUEST_PLATE");
  }

  if (
    !vehicle_id &&
    !["CAR", "MOTORBIKE", "BICYCLE"].includes(
      String(vehicle_type || "").toUpperCase()
    )
  ) {
    throw new Error("INVALID_VEHICLE_TYPE");
  }

  if (guest_plate !== undefined && guest_plate !== null && typeof guest_plate !== "string") {
    throw new Error("INVALID_GUEST_PLATE");
    }

  if (guest_plate && guest_plate.trim().length > 20) {
    throw new Error("INVALID_GUEST_PLATE");
  }

  return staffRepository.manualCheckIn({
    staffId: staff_id,
    parkingLotId: parking_lot_id,
    vehicleId: vehicle_id || null,
    guestPlate: guest_plate
      ? guest_plate.trim().toUpperCase()
      : null,
    vehicleType: vehicle_type
      ? vehicle_type.toUpperCase()
      : null,
  });
}

async function manualCheckOut(data) {
  const { staff_id, session_id, payment_method } = data;

  if (!staff_id || !session_id || !payment_method) {
    throw new Error("CHECKOUT_FIELDS_REQUIRED");
  }

  if (!["CASH"].includes(String(payment_method).toUpperCase())) {
    throw new Error("INVALID_PAYMENT_METHOD");
  }

  return staffRepository.manualCheckOut({
    staffId: staff_id,
    sessionId: session_id,
    paymentMethod: payment_method.toUpperCase(),
  });
}

const getActiveParkingSessions = async (parkingLotId) => {
  if (parkingLotId && !/^[0-9a-fA-F-]{36}$/.test(parkingLotId)) {
    const error = new Error("parking_lot_id không hợp lệ");
    error.statusCode = 400;
    error.code = "INVALID_PARKING_LOT_ID";
    throw error;
  }

  return staffRepository.getActiveParkingSessions(
    parkingLotId || null
  );
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
