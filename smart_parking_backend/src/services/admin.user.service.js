const userRepository = require('../repositories/user.repository');
const { hashPassword } = require('../utils/password');

const VALID_STATUSES = ['ACTIVE', 'BLOCKED', 'DELETED'];

//Lấy danh sách & tìm kiếm
const getUsers = async (queryParams) => {
  return await userRepository.getAllUsers(queryParams);
};

//Tạo tài khoản Staff
const createStaff = async ({ fullName, full_name, email, phone, password }) => {
  const finalFullName = fullName || full_name;

  if (!finalFullName || !email || !phone || !password) {
    const error = new Error('Vui lòng điền đầy đủ họ tên, email, số điện thoại và mật khẩu');
    error.statusCode = 400;
    throw error;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Email không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
  if (!phoneRegex.test(phone)) {
    const error = new Error('Số điện thoại không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6 || password.length > 10) {
    const error = new Error('Mật khẩu phải từ 6 đến 10 ký tự');
    error.statusCode = 400;
    throw error;
  }


  // Kiểm tra trùng lặp email/phone
  const existingEmail = await userRepository.findByEmail(email);
  if (existingEmail) {
    const error = new Error('Email này đã được sử dụng');
    error.statusCode = 400;
    throw error;
  }

  const existingPhone = await userRepository.findByPhone(phone);
  if (existingPhone) {
    const error = new Error('Số điện thoại này đã được sử dụng');
    error.statusCode = 400;
    throw error;
  }

  // Hash mật khẩu
  const passwordHash = await hashPassword(password);
  return await userRepository.createStaffUser({
    fullName: finalFullName,
    email,
    phone,
    passwordHash
  });
};

//Khóa / Mở khóa / Xóa mềm tài khoản
const changeStatus = async (targetUserId, status, currentAdminId) => {
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error('Trạng thái không hợp lệ (chỉ chấp nhận ACTIVE, BLOCKED hoặc DELETED)');
    error.statusCode = 400;
    throw error;
  }

  // Ràng buộc an toàn: Không cho phép Admin tự khóa tài khoản của chính mình
  if (targetUserId === currentAdminId) {
    const error = new Error('Không thể tự thay đổi trạng thái tài khoản của chính bạn');
    error.statusCode = 400;
    throw error;
  }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
        const error = new Error('Không tìm thấy người dùng');
        error.statusCode = 404;
        throw error;
    }

    if (targetUser.role === 'ADMIN') {
        const error = new Error('Không thể thay đổi trạng thái tài khoản ADMIN');
        error.statusCode = 403;
        throw error;
    }

  //Thực hiện cập nhật
  const updated = await userRepository.updateUserStatus(targetUserId, status);

  // Nếu khóa hoặc xóa thì thu hồi toàn bộ token đăng nhập
  if (status === 'BLOCKED' || status === 'DELETED') {
    await userRepository.revokeUserTokens(targetUserId);
  }

  return updated;
};

module.exports = {
  getUsers,
  createStaff,
  changeStatus
};