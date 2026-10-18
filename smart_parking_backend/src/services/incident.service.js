const incidentRepository = require('../repositories/incident.repository');

/**
 * Báo mất / lộ mã QR Code
 */
const reportLostQr = async (userId, data) => {
  const { credentialId, vehicleId, note } = data;

  // Kiểm tra mô tả
  if (!note || note.trim() === '') {
    const error = new Error('Vui lòng nhập lý do hoặc mô tả việc mất/lộ mã QR');
    error.statusCode = 400;
    throw error;
  }

  // Bắt buộc phải có credential hoặc vehicle
  if (!credentialId && !vehicleId) {
    const error = new Error(
      'Vui lòng cung cấp credentialId hoặc vehicleId'
    );
    error.statusCode = 400;
    throw error;
  }

  // TODO:
  // Sau này có thể kiểm tra:
  // - credentialId có tồn tại không
  // - vehicleId có tồn tại không
  // - Có thuộc user hiện tại không

  return await incidentRepository.createIncident({
    userId,
    credentialId: credentialId || null,
    vehicleId: vehicleId || null,
    type: 'LOST_QR',
    note: note.trim()
  });
};

/**

 * Báo cáo sự cố chung
 */
const reportGeneralIncident = async (userId, data) => {
  const { type, note, vehicleId } = data;

  if (!type || !note) {
    const error = new Error(
      'Vui lòng chọn loại sự cố và nhập nội dung mô tả'
    );
    error.statusCode = 400;
    throw error;
  }

  // Chỉ cho phép các loại sự cố chung
  const allowedTypes = [
    'PAYMENT_ERROR',
    'GATE_ERROR',
    'OTHER'
  ];

  if (!allowedTypes.includes(type)) {
    const error = new Error(
      `Loại sự cố không hợp lệ. Cho phép: ${allowedTypes.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  // TODO:
  // Sau này có thể kiểm tra:
  // - vehicleId có tồn tại không
  // - Có thuộc user hiện tại không

  return await incidentRepository.createIncident({
    userId,
    vehicleId: vehicleId || null,
    credentialId: null,
    type,
    note: note.trim()
  });
};

// Lấy danh sách sự cố của chính khách hàng
const getCustomerIncidents = async (userId) => {
  const incidents =
        await incidentRepository.getIncidentsByUserId(userId);

    return incidents || [];
};

module.exports = {
  reportLostQr,
  reportGeneralIncident,
  getCustomerIncidents
};