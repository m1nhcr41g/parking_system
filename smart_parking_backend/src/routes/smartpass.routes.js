const express = require("express");
const router = express.Router();

const smartpassController = require("../controllers/smartpass.controller");

router.post("/", smartpassController.createSmartPass);
router.get("/", smartpassController.getSmartPasses);
router.patch("/:id/autopay", smartpassController.updateAutoPay);

module.exports = router;