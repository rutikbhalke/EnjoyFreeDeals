const express = require("express");
const priceAlertController = require("../controllers/priceAlertController");

const router = express.Router();

router.post("/", priceAlertController.createPriceAlert);
router.get("/:userId", priceAlertController.getPriceAlerts);
router.delete("/:userId/:dealId", priceAlertController.removePriceAlert);

module.exports = router;
