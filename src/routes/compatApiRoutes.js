const express = require("express");
const compatApiController = require("../controllers/compatApiController");

const router = express.Router();

router.get("/compare-price", compatApiController.comparePrice);
router.post("/filter-telegram-deals", compatApiController.filterTelegramDeal);
router.post("/send-whatsapp-otp", compatApiController.sendWhatsAppOtp);
router.post("/verify-whatsapp-otp", compatApiController.verifyWhatsAppOtp);
router.get("/saved-deals", compatApiController.savedDeals);
router.post("/saved-deals", compatApiController.savedDeals);
router.delete("/saved-deals", compatApiController.savedDeals);

module.exports = router;
