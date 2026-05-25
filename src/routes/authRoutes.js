const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.post("/password-reset", authController.sendPasswordReset);
router.get("/me", authController.me);

module.exports = router;
