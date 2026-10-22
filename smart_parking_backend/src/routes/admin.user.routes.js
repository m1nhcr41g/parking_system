const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/admin.user.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
//bắt buộc phải gửi Access Token hợp lệ
router.use(authenticateToken);

// Bắt buộc tài khoản phải có quyền ADMIN
router.use(authorizeRoles('ADMIN'));

//Tra cứu danh sách tất cả người dùng hệ thống
router.get('/users', adminUserController.getAllUsers);

// chi tiết nguoi dung
router.get('/users/:id', adminUserController.getUserById);

//Khóa hoặc Mở khóa tài khoản người dùng
router.patch('/users/:id/status', adminUserController.updateStatus);

//Tạo tài khoản & Hồ sơ Nhân viên (STAFF)
router.post('/staff', adminUserController.createStaff);


module.exports = router;