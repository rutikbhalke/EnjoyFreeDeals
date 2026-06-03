const express = require("express");
const scraperReviewController = require("../controllers/scraperReviewController");
const telegramImportController = require("../controllers/telegramImportController");
const { requireAdmin } = require("../middleware/adminAuth");
const { requireImportAccess } = require("../middleware/importAuth");

const router = express.Router();

router.get("/import-telegram", requireImportAccess, telegramImportController.importDeals);
router.post("/import-telegram", requireImportAccess, telegramImportController.importDeals);
router.get("/telegram-status", requireImportAccess, telegramImportController.status);
router.get("/scrape-genie-loot", requireImportAccess, telegramImportController.scrapePage);
router.post("/scrape-genie-loot", requireImportAccess, telegramImportController.scrapePage);
router.get("/sync-genie-loot", requireImportAccess, telegramImportController.syncGenieLoot);
router.post("/sync-genie-loot", requireImportAccess, telegramImportController.syncGenieLoot);
router.get("/enrich-genie-loot", requireImportAccess, telegramImportController.enrichDetails);
router.post("/enrich-genie-loot", requireImportAccess, telegramImportController.enrichDetails);
router.get("/genie-loot-jobs/:id", requireImportAccess, telegramImportController.jobStatus);
router.get("/scraped-deals", requireAdmin, scraperReviewController.listScrapedDeals);
router.post("/scraped-deals/:id/approve", requireAdmin, scraperReviewController.approveScrapedDeal);
router.post("/scraped-deals/:id/reject", requireAdmin, scraperReviewController.rejectScrapedDeal);

module.exports = router;
