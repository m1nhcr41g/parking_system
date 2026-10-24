const incidentService = require('../services/incident.service');

const reportLostQr = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await incidentService.reportLostQr(userId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu báo mất/lộ mã QR thành công',
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi gửi yêu cầu báo mất mã QR'
    });
  }
};

const reportGeneralIncident = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await incidentService.reportGeneralIncident(userId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Gửi báo cáo sự cố thành công',
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi gửi báo cáo sự cố'
    });
  }
};

//lấy danh sách sự cố của khách hàng
const getCustomerIncidents = async (req, res) => {
  try {
    const userId = req.user.id;
    const incidents = await incidentService.getCustomerIncidents(userId);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sự cố thành công',
      data: incidents
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách sự cố'
    });
  }
};

const getAllIncidents = async (req, res) => {
  try {
    const { status } = req.query; 
    const incidents = await incidentService.getAllIncidents(status);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sự cố thành công',
      data: incidents
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách sự cố'
    });
  }
};

const verifyIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await incidentService.verifyIncident(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Xác minh và cập nhật sự cố thành công',
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi xác minh sự cố'
    });
  }
};

module.exports = {
  reportLostQr,
  reportGeneralIncident,
  getCustomerIncidents,
  getAllIncidents,
  verifyIncident
};