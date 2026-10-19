const express = require("express");
const router = express.Router();
const controller = require("../controllers/automatic-access.controller");

router.post("/check-in", controller.checkIn);
router.post("/check-out", controller.checkOut);

module.exports = router;
