const adminUserService = require('../services/admin.user.service');

// GET /api/v1/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await adminUserService.getUsers({ page, limit, search, role, status });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách người dùng thành công',
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống khi lấy danh sách người dùng'
    });
  }
};

// POST /api/v1/admin/staff
const createStaff = async (req, res) => {
  try {
    const newStaff = await adminUserService.createStaff(req.body);
    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản nhân viên (STAFF) thành công',
      data: newStaff
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Lỗi khi tạo tài khoản nhân viên'
    });
  }
};

// PATCH /api/v1/admin/users/:id/status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentAdminId = req.user?.id; // Lấy từ auth.middleware sau khi giải mã token

    const updatedUser = await adminUserService.changeStatus(id, status, currentAdminId);
    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái người dùng thành ${status} thành công`,
      data: updatedUser
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật trạng thái người dùng'
    });
  }
};

module.exports = {
  getAllUsers,
  createStaff,
  updateStatus
};