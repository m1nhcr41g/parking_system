const { sql } = require('../config/db');

// Kiểm tra email đã tồn tại hay chưa
const findByEmail = async (email) => {
  const request = new sql.Request();
  const result = await request
    .input('email', sql.VarChar(100), email)
    .query('SELECT * FROM users WHERE email = @email');
  return result.recordset[0];
};

// Kiểm tra số điện thoại đã tồn tại hay chưa
const findByPhone = async (phone) => {
  const request = new sql.Request();
  const result = await request
    .input('phone', sql.VarChar(20), phone)
    .query('SELECT * FROM users WHERE phone = @phone');
  return result.recordset[0];
};

// Thêm user mới vào bảng users
const createUser = async ({ fullName, email, phone, passwordHash }) => {
  const request = new sql.Request();
  const result = await request
    .input('full_name', sql.NVarChar(100), fullName)
    .input('email', sql.VarChar(100), email)
    .input('phone', sql.VarChar(20), phone)
    .input('password', sql.VarChar(255), passwordHash)
    .query(`
      INSERT INTO users (full_name, email, phone, password, role, status)
      OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.status, INSERTED.created_at
      VALUES (@full_name, @email, @phone, @password, 'CUSTOMER', 'ACTIVE')
    `);
  return result.recordset[0];
};

// Lấy thông tin user (loại bỏ trường password)
const findById = async (id) => {
  const request = new sql.Request();
  const result = await request
    .input('id', sql.VarChar(36), id)
    .query(`
      SELECT id, full_name, email, phone, role, status, created_at, updated_at 
      FROM users 
      WHERE id = @id
    `);
  return result.recordset[0];
};

// Lấy thông tin user kèm password hash (phục vụ đối soát mật khẩu cũ)
const findByIdWithPassword = async (id) => {
  const request = new sql.Request();
  const result = await request
    .input('id', sql.VarChar(36), id)
    .query('SELECT * FROM users WHERE id = @id');
  return result.recordset[0];
};

// Cập nhật họ tên và số điện thoại
const updateProfile = async (id, { fullName, phone }) => {
  const request = new sql.Request();
  const result = await request
    .input('id', sql.VarChar(36), id)
    .input('full_name', sql.NVarChar(100), fullName)
    .input('phone', sql.VarChar(20), phone)
    .query(`
      UPDATE users 
      SET full_name = @full_name, phone = @phone, updated_at = GETDATE()
      OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.status, INSERTED.updated_at
      WHERE id = @id
    `);
  return result.recordset[0];
};

// Cập nhật mật khẩu mới
const updatePassword = async (id, newPasswordHash) => {
  const request = new sql.Request();
  await request
    .input('id', sql.VarChar(36), id)
    .input('password', sql.VarChar(255), newPasswordHash)
    .query(`
      UPDATE users 
      SET password = @password, updated_at = GETDATE() 
      WHERE id = @id
    `);
};

const saveRefreshToken = async (userId, token, expiresAt) => {
  const request = new sql.Request();
  await request
    .input('userId', sql.VarChar(36), userId)
    .input('token', sql.VarChar(500), token)
    .input('expiresAt', sql.DateTime2, expiresAt)
    .query(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (@userId, @token, @expiresAt)
    `);
};

// Tìm Refresh Token trong DB
const findRefreshToken = async (token) => {
  const request = new sql.Request();
  const result = await request
    .input('token', sql.VarChar(500), token)
    .query('SELECT * FROM refresh_tokens WHERE token = @token AND revoked = 0');
  return result.recordset[0];
};

// Xóa Refresh Token khi thu hồi hoặc đăng xuất
const revokeRefreshToken = async (token) => {
  const request = new sql.Request();

  await request
    .input('token', sql.VarChar(500), token)
    .query(`
      UPDATE refresh_tokens
      SET revoked = 1
      WHERE token = @token
    `);
};


//Lấy danh sách users (phân trang, tìm kiếm, lọc theo role/status)
const getAllUsers = async ({ page = 1, limit = 10, search = '', role, status }) => {
  const request = new sql.Request();
  const offset = (Number(page) - 1) * Number(limit);

  let filterConditions = ' WHERE 1=1';

  if (search) {
    request.input('search', sql.NVarChar(100), `%${search}%`);
    filterConditions += ` AND (full_name LIKE @search OR email LIKE @search OR phone LIKE @search)`;
  }

  if (role) {
    request.input('role', sql.VarChar(20), role);
    filterConditions += ` AND role = @role`;
  }

  if (status) {
    request.input('status', sql.VarChar(20), status);
    filterConditions += ` AND status = @status`;
  }

  // Đếm tổng số bản ghi
  const countRequest = new sql.Request();

  if (search) {
    countRequest.input('search', sql.NVarChar(100), `%${search}%`);
  }

  if (role) {
    countRequest.input('role', sql.VarChar(20), role);
  }

  if (status) {
    countRequest.input('status', sql.VarChar(20), status);
  }

  const totalCountResult = await countRequest.query(`
    SELECT COUNT(*) AS total
    FROM users
    ${filterConditions}
  `);

  const total = totalCountResult.recordset[0].total;

  // Lấy dữ liệu theo phân trang
  const listRequest = new sql.Request();

  if (search) {
    listRequest.input('search', sql.NVarChar(100), `%${search}%`);
  }

  if (role) {
    listRequest.input('role', sql.VarChar(20), role);
  }

  if (status) {
    listRequest.input('status', sql.VarChar(20), status);
  }

  listRequest.input('offset', sql.Int, offset);
  listRequest.input('limit', sql.Int, Number(limit));

  const usersResult = await listRequest.query(`
    SELECT
      id,
      full_name,
      email,
      phone,
      role,
      status,
      created_at,
      updated_at
    FROM users
    ${filterConditions}
    ORDER BY created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `);

  return {
    users: usersResult.recordset,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit))
  };
};

//Thêm mới nhân viên STAFF
const createStaffUser = async ({ fullName, email, phone, passwordHash }) => {
  const request = new sql.Request();
  const result = await request
    .input('full_name', sql.NVarChar(100), fullName)
    .input('email', sql.VarChar(100), email)
    .input('phone', sql.VarChar(20), phone)
    .input('password', sql.VarChar(255), passwordHash)
    .query(`
      INSERT INTO users (full_name, email, phone, password, role, status)
      OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.status, INSERTED.created_at
      VALUES (@full_name, @email, @phone, @password, 'STAFF', 'ACTIVE')
    `);
  return result.recordset[0];
};

//Cập nhật trạng thái (Khóa / Mở khóa / Xóa mềm)
const updateUserStatus = async (id, status) => {
  const request = new sql.Request();
  const result = await request
    .input('id', sql.VarChar(36), id)
    .input('status', sql.VarChar(20), status)
    .query(`
      UPDATE users 
      SET status = @status, updated_at = GETDATE()
      OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.status, INSERTED.updated_at
      WHERE id = @id
    `);
  return result.recordset[0];
};

//Thu hồi token của user bị khóa
const revokeUserTokens = async (userId) => {
  const request = new sql.Request();
  await request
    .input('userId', sql.VarChar(36), userId)
    .query(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = @userId`);
};

module.exports = {
  findByEmail,
  findByPhone,
  createUser,
  findById,
  findByIdWithPassword,
  updateProfile,
  updatePassword,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  getAllUsers,
  createStaffUser, 
  updateUserStatus, 
  revokeUserTokens
};