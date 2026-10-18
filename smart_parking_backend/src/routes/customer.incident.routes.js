const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Khách hàng bắt buộc phải gửi Access Token hợp lệ
router.use(authenticateToken);

// Bắt buộc tài khoản phải có quyền CUSTOMER
router.use(authorizeRoles('CUSTOMER'));

//  Báo mất/lộ mã QR, Barcode
router.post('/report-lost-qr', incidentController.reportLostQr);

//  Báo cáo sự cố chung
router.post('/', incidentController.reportGeneralIncident);

// Lấy danh sách các sự cố của khách hàng
router.get('/', incidentController.getCustomerIncidents);

module.exports = router;