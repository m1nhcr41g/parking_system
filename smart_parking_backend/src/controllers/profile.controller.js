const profileService = require('../services/profile.service');

const getProfile = async (req, res) => {
  try {
    const user = await profileService.getProfile(req.user.id);
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin hồ sơ'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    if (!fullName && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ít nhất họ tên hoặc số điện thoại cần thay đổi'
      });
    }

    if (phone) {
      const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ'
        });
      }
    }

    const updatedUser = await profileService.updateProfile(req.user.id, { fullName, phone });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: updatedUser
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật hồ sơ'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp cả mật khẩu cũ và mật khẩu mới'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    await profileService.changePassword(req.user.id, { oldPassword, newPassword });

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi server khi đổi mật khẩu'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};