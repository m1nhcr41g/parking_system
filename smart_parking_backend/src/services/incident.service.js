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

const getCustomerIncidents = async (userId) => {
  const incidents = await incidentRepository.getIncidentsByUserId(userId);
    return incidents || [];
};

const getAllIncidents = async (status) => {
  const incidents = await incidentRepository.gettAllIncidents(status);
  return incidents || [];
};

const verifyIncident = async (incidentId, data) => {
  const { status, resolutionNote } = data;

  if (!status) {
    const error = new Error('Trạng thái (status) không được để trống');
    error.statusCode = 400;
    throw error;
  }

  const allowedStatuses = ['IN_PROGRESS', 'RESOLVED', 'REJECTED'];
  if (!allowedStatuses.includes(status)) {
    const error = new Error(
      `Trạng thái không hợp lệ. Cho phép: ${allowedStatuses.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  const updatedIncident = await incidentRepository.verifyIncident(incidentId, {
    status,
    resolutionNote: resolutionNote ? resolutionNote.trim() : null
  });

  if (!updatedIncident) {
    const error = new Error('Không tìm thấy thông tin sự cố cần xử lý');
    error.statusCode = 404;
    throw error;
  }

  return updatedIncident;
};
module.exports = {
  reportLostQr,
  reportGeneralIncident,
  getCustomerIncidents,
  getAllIncidents,
  verifyIncident
};