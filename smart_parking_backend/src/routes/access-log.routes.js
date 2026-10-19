const express = require("express");
const router = express.Router();

const accessLogController = require("../controllers/access-log.controller");

router.get("/", accessLogController.getAccessLogs);

module.exports = router;
