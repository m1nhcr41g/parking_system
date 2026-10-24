const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.use(authenticateToken);
router.use(authorizeRoles('STAFF', 'ADMIN'));
router.get('/', incidentController.getAllIncidents);
router.put('/:id/verify', incidentController.verifyIncident);

module.exports = router;