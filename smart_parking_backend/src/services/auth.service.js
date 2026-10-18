const userRepository = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken,generateRefreshToken, 
  verifyRefreshToken } = require('../utils/jwt');

/**
 * Đăng ký tài khoản
 */
const register = async ({ fullName, email, phone, password }) => {
  // 1. Kiểm tra email đã tồn tại
  const existingEmail = await userRepository.findByEmail(email);
  if (existingEmail) {
    const error = new Error('Email này đã được sử dụng');
    error.statusCode = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  // 2. Kiểm tra số điện thoại đã tồn tại
  const existingPhone = await userRepository.findByPhone(phone);
  if (existingPhone) {
    const error = new Error('Số điện thoại này đã được sử dụng');
    error.statusCode = 409;
    error.code = 'PHONE_ALREADY_EXISTS';
    throw error;
  }

  // 3. Mã hóa mật khẩu
  const passwordHash = await hashPassword(password);

  // 4. Lưu user vào database
  const newUser = await userRepository.createUser({
    fullName,
    email,
    phone,
    passwordHash
  });

  return newUser;
};

/**
 * Đăng nhập
 */
const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== 'ACTIVE') {
    const error = new Error(`Tài khoản hiện đang bị khóa (${user.status})`);
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  // 1. Tạo cặp tokens
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // 2. Tính ngày hết hạn (7 ngày tới) và lưu vào database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await userRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status
    }
  };
};

// Cấp lại accessToken khi client gửi refreshToken hợp lệ
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Vui lòng cung cấp refreshToken');
    error.statusCode = 400;
    throw error;
  }

  // 1. Kiểm tra token có lưu trong DB không
  const tokenInDb = await userRepository.findRefreshToken(refreshToken);
  if (!tokenInDb) {
    const error = new Error('Refresh token không tồn tại hoặc đã bị thu hồi');
    error.statusCode = 403;
    error.code = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  // 2. Kiểm tra token có hết hạn trong DB chưa
  if (new Date(tokenInDb.expires_at) < new Date()) {
    await userRepository.revokeRefreshToken(refreshToken);
    const error = new Error('Refresh token đã hết hạn, vui lòng đăng nhập lại');
    error.statusCode = 403;
    error.code = 'REFRESH_TOKEN_EXPIRED';
    throw error;
  }

  // 3. Verify giải mã token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    await userRepository.revokeRefreshToken(refreshToken);
    const error = new Error('Refresh token không hợp lệ');
    error.statusCode = 403;
    error.code = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  // 4. Tạo accessToken mới
  const newAccessToken = generateAccessToken({
    id: decoded.id,
    email: decoded.email,
    role: decoded.role
  });

  return {
    accessToken: newAccessToken
  };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Vui lòng cung cấp refreshToken để đăng xuất');
    error.statusCode = 400;
    throw error;
  }

  // 1. Kiểm tra token có trong DB không
  const tokenInDb = await userRepository.findRefreshToken(refreshToken);
  if (!tokenInDb) {
    const error = new Error('Token không tồn tại hoặc đã bị đăng xuất trước đó');
    error.statusCode = 404;
    throw error;
  }

  // 2. Thu hồi token trong DB
  await userRepository.revokeRefreshToken(refreshToken);
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout
};