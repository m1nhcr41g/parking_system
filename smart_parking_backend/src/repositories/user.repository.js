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
  revokeRefreshToken
};