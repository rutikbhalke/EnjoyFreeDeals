const express = require("express");
const scraperReviewController = require("../controllers/scraperReviewController");
const telegramImportController = require("../controllers/telegramImportController");
const migrationController = require("../controllers/migrationController");
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
router.get("/scrape-all-deals", requireImportAccess, telegramImportController.scrapeAllDeals);
router.post("/scrape-all-deals", requireImportAccess, telegramImportController.scrapeAllDeals);
router.get("/enrich-genie-loot", requireImportAccess, telegramImportController.enrichDetails);
router.post("/enrich-genie-loot", requireImportAccess, telegramImportController.enrichDetails);
router.get("/genie-loot-jobs/:id", requireImportAccess, telegramImportController.jobStatus);
router.get("/flagged-deals", requireAdmin, scraperReviewController.listFlaggedDeals);
router.get("/migrate", requireAdmin, migrationController.getMigrationSql);
router.post("/migrate", requireAdmin, migrationController.runMigration);
router.patch("/deals/:id", requireAdmin, scraperReviewController.updateAdminDeal);
router.post("/deals/:id/approve", requireAdmin, scraperReviewController.approveAdminDeal);
router.post("/deals/:id/reject", requireAdmin, scraperReviewController.rejectAdminDeal);
router.post("/deals/:id/flag", requireAdmin, scraperReviewController.flagAdminDeal);
router.get("/scraped-deals", requireAdmin, scraperReviewController.listScrapedDeals);
router.post("/scraped-deals/:id/approve", requireAdmin, scraperReviewController.approveScrapedDeal);
router.post("/scraped-deals/:id/reject", requireAdmin, scraperReviewController.rejectScrapedDeal);
router.get("/telegram-scraped-deals", requireAdmin, scraperReviewController.listTelegramDeals);
router.get("/telegram-scrape-logs", requireAdmin, scraperReviewController.listScrapeLogs);
router.post("/telegram-scraped-deals/:id/manual-price", requireAdmin, scraperReviewController.updateManualPrice);
router.post("/telegram-scraped-deals/:id/manual-expiry", requireAdmin, scraperReviewController.updateManualExpiry);
router.post("/telegram-scraped-deals/:id/expire", requireAdmin, scraperReviewController.markTelegramDealExpired);

module.exports = router;
