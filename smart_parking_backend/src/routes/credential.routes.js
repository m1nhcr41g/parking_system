const express = require("express");
const router = express.Router();

const credentialController = require("../controllers/credential.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/", credentialController.getAllCredentials);
router.post("/reissue", credentialController.reissueCredential);

module.exports = router;