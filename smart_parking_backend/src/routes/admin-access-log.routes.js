const express = require("express");
const router = express.Router();

const accessLogController = require("../controllers/access-log.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/", accessLogController.getAccessLogs);

module.exports = router;