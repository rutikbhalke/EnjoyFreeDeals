const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/whatsapp/request-otp", authController.requestWhatsAppOtp);
router.post("/whatsapp/verify-otp", authController.verifyWhatsAppOtp);
router.get("/me", authController.me);

module.exports = router;
