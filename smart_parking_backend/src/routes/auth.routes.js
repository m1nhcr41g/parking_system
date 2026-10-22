const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require("../middlewares/auth.middleware");

// Các route công khai (Public) - KHÔNG cần token
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Route cần xác thực - Phải đăng nhập mới được logout
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;