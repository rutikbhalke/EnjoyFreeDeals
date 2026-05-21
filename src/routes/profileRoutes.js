const express = require("express");
const profileController = require("../controllers/profileController");

const router = express.Router();

router.get("/:userId", profileController.getProfile);
router.put("/:userId", profileController.updateProfile);

module.exports = router;
