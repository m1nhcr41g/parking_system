
// Middleware: Phân quyền theo Role (RBAC)
// Dùng để kiểm tra vai trò người dùng sau khi đã qua bước xác thực token
 
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user được sinh ra từ authenticateToken chạy trước đó
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Không tìm thấy thông tin quyền của người dùng'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: [${allowedRoles.join(', ')}]`
        }
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };