const express = require("express");
const scraperReviewController = require("../controllers/scraperReviewController");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/scraped-deals", requireAdmin, scraperReviewController.listScrapedDeals);
router.post("/scraped-deals/:id/approve", requireAdmin, scraperReviewController.approveScrapedDeal);
router.post("/scraped-deals/:id/reject", requireAdmin, scraperReviewController.rejectScrapedDeal);

module.exports = router;
