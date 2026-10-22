const { sql, poolPromise } = require('../config/db');
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
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.phone, 
        u.role, 
        u.status, 
        u.created_at, 
        u.updated_at,
        sp.employee_id,
        sp.department
      FROM users u
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      WHERE u.id = @id
    `);

  const row = result.recordset[0];
  if (!row) return null;

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    staff_profile: row.role === 'STAFF' ? {
      employee_id: row.employee_id,
      department: row.department
    } : null
  };
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
    filterConditions += ` AND (u.full_name LIKE @search OR u.email LIKE @search OR u.phone LIKE @search OR sp.employee_id LIKE @search)`;
  }

  if (role) {
    request.input('role', sql.VarChar(20), role);
    filterConditions += ` AND u.role = @role`;
  }

  if (status) {
    request.input('status', sql.VarChar(20), status);
    filterConditions += ` AND u.status = @status`;
  }

  // Đếm tổng số bản ghi
  const countRequest = new sql.Request();
  if (search) countRequest.input('search', sql.NVarChar(100), `%${search}%`);
  if (role) countRequest.input('role', sql.VarChar(20), role);
  if (status) countRequest.input('status', sql.VarChar(20), status);

  const totalCountResult = await countRequest.query(`
    SELECT COUNT(*) AS total
    FROM users u
    LEFT JOIN staff_profiles sp ON u.id = sp.user_id
    ${filterConditions}
  `);

  const total = totalCountResult.recordset[0].total;

  // Lấy dữ liệu theo phân trang
  const listRequest = new sql.Request();
  if (search) listRequest.input('search', sql.NVarChar(100), `%${search}%`);
  if (role) listRequest.input('role', sql.VarChar(20), role);
  if (status) listRequest.input('status', sql.VarChar(20), status);
  listRequest.input('offset', sql.Int, offset);
  listRequest.input('limit', sql.Int, Number(limit));

  const usersResult = await listRequest.query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.role,
      u.status,
      u.created_at,
      u.updated_at,
      sp.employee_id,
      sp.department
    FROM users u
    LEFT JOIN staff_profiles sp ON u.id = sp.user_id
    ${filterConditions}
    ORDER BY u.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `);

  // Định dạng lại: gom thông tin staff thành object riêng
  const formattedUsers = usersResult.recordset.map(row => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    staff_profile: row.role === 'STAFF' ? {
      employee_id: row.employee_id,
      department: row.department
    } : null
  }));

  return {
    users: formattedUsers,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit))
  };
};

//Thêm mới nhân viên STAFF
const createStaffUser = async ({ fullName, email, phone, passwordHash, employeeId, department }) => {
  const pool = await poolPromise; // Đảm bảo lấy connection pool
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // 1. Chèn vào bảng users
    const userRequest = new sql.Request(transaction);
    const userResult = await userRequest
      .input('full_name', sql.NVarChar(100), fullName)
      .input('email', sql.VarChar(100), email)
      .input('phone', sql.VarChar(20), phone)
      .input('password', sql.VarChar(255), passwordHash)
      .query(`
        INSERT INTO users (full_name, email, phone, password, role, status)
        OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.status, INSERTED.created_at
        VALUES (@full_name, @email, @phone, @password, 'STAFF', 'ACTIVE')
      `);

    const newUser = userResult.recordset[0];

    // 2. Tự sinh employeeId nếu client không gửi (ví dụ: NV_cắt 8 ký tự ID)
    const finalEmployeeId = employeeId || `STAFF_${Date.now().toString().slice(-6)}`;

    // 3. Chèn vào bảng staff_profiles
    const profileRequest = new sql.Request(transaction);
    await profileRequest
      .input('user_id', sql.VarChar(36), newUser.id)
      .input('employee_id', sql.VarChar(50), finalEmployeeId)
      .input('department', sql.NVarChar(100), department || 'Vận hành bãi đỗ')
      .query(`
        INSERT INTO staff_profiles (user_id, employee_id, department)
        VALUES (@user_id, @employee_id, @department)
      `);

    await transaction.commit();

    return {
      ...newUser,
      staff_profile: {
        employee_id: finalEmployeeId,
        department: department || 'Vận hành bãi đỗ'
      }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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