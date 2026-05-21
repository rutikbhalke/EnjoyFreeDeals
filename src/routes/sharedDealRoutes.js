const express = require("express");
const sharedDealController = require("../controllers/sharedDealController");

const router = express.Router();

router.post("/", sharedDealController.addSharedDeal);
router.get("/:userId", sharedDealController.getSharedDeals);

module.exports = router;
