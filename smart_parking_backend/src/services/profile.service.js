const userRepository = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');

const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    const error = new Error('Không tìm thấy thông tin tài khoản');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const updateProfile = async (userId, { fullName, phone }) => {
  const currentUser = await userRepository.findById(userId);
  if (!currentUser) {
    const error = new Error('Tài khoản không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  // Nếu người dùng thay đổi SĐT, kiểm tra trùng lặp
  if (phone && phone !== currentUser.phone) {
    const existingPhone = await userRepository.findByPhone(phone);
    if (existingPhone && existingPhone.id !== userId) {
      const error = new Error('Số điện thoại này đã được tài khoản khác sử dụng');
      error.statusCode = 409;
      throw error;
    }
  }

  return await userRepository.updateProfile(userId, {
    fullName: fullName || currentUser.full_name,
    phone: phone || currentUser.phone
  });
};

const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) {
    const error = new Error('Tài khoản không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  // 1. So khớp mật khẩu cũ
  const isMatch = await comparePassword(oldPassword, user.password);
  if (!isMatch) {
    const error = new Error('Mật khẩu hiện tại không chính xác');
    error.statusCode = 400;
    throw error;
  }

  // 2. Không cho phép trùng mật khẩu cũ
  if (oldPassword === newPassword) {
    const error = new Error('Mật khẩu mới không được trùng với mật khẩu cũ');
    error.statusCode = 400;
    throw error;
  }

  // 3. Băm và cập nhật mật khẩu mới
  const newPasswordHash = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, newPasswordHash);
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};