const express = require("express");
const telegramScraperController = require("../controllers/telegramScraperController");
const { requireImportAccess } = require("../middleware/importAuth");

const router = express.Router();

router.get("/scrape-telegram/status", telegramScraperController.status);
router.post("/scrape-telegram", requireImportAccess, telegramScraperController.scrape);
router.get("/cron/scrape-telegram", telegramScraperController.cron);

module.exports = router;
