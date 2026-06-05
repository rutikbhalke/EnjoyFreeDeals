const express = require("express");
const recentlyViewedController = require("../controllers/recentlyViewedController");

const router = express.Router();

router.post("/", recentlyViewedController.recordRecentlyViewed);
router.get("/:userId", recentlyViewedController.getRecentlyViewed);

module.exports = router;
