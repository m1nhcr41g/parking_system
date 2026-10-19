const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Toàn bộ các route phía dưới đều được bảo vệ bởi middleware
router.use(authenticateToken);

router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);
router.put('/change-password', profileController.changePassword);

module.exports = router;