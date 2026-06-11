const express = require("express");
const priceHistoryController = require("../controllers/priceHistoryController");

const router = express.Router();

router.get("/", priceHistoryController.getPriceHistory);

module.exports = router;
