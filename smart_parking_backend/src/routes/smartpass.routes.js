const express = require("express");
const router = express.Router();

const smartpassController = require("../controllers/smartpass.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

router.use(authenticateToken, authorizeRoles("CUSTOMER"));

router.post("/", smartpassController.createSmartPass);
router.get("/", smartpassController.getSmartPasses);
router.patch("/:id/autopay", smartpassController.updateAutoPay);

module.exports = router;