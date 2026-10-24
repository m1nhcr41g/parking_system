const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.use(authenticateToken);
router.use(authorizeRoles('CUSTOMER'));

router.post('/report-lost-qr', incidentController.reportLostQr);
router.post('/', incidentController.reportGeneralIncident);
router.get('/', incidentController.getCustomerIncidents);

module.exports = router;