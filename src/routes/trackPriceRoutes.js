const express = require("express");
const trackPriceController = require("../controllers/trackPriceController");

const router = express.Router();

router.get("/", trackPriceController.trackPrice);
router.post("/", trackPriceController.trackPrice);

module.exports = router;
