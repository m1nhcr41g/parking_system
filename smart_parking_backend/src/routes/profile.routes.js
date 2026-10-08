const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Toàn bộ các route phía dưới đều được bảo vệ bởi middleware
router.use(authenticateToken);

router.get('/me', profileController.getProfile);
router.put('/me', profileController.updateProfile);
router.put('/change-password', profileController.changePassword);

module.exports = router;