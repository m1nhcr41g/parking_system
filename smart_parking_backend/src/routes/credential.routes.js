const express = require("express");
const router = express.Router();

const credentialController = require("../controllers/credential.controller");

router.get("/", credentialController.getAllCredentials);
router.post("/reissue", credentialController.reissueCredential);

module.exports = router;
