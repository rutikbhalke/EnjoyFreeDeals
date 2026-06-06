const { getTelegramScraperStatus, scrapeTelegramDeals } = require("../../lib/telegramScraper");
const { sendSuccess } = require("../utils/responses");

async function scrape(req, res, next) {
  try {
    const body = req.body || {};
    const result = await scrapeTelegramDeals({
      channels: body.channels || req.query.channels,
      limit: body.limit || req.query.limit
    });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function status(_req, res, next) {
  try {
    return sendSuccess(res, getTelegramScraperStatus());
  } catch (error) {
    next(error);
  }
}

async function cron(req, res, next) {
  try {
    const expectedSecret = process.env.CRON_SECRET || "";
    const actualSecret = bearerToken(req) || String(req.query.secret || "");
    if (!expectedSecret || actualSecret !== expectedSecret) {
      return res.status(401).json({
        success: false,
        message: "Cron secret is required."
      });
    }

    const result = await scrapeTelegramDeals({
      channels: req.query.channels,
      limit: req.query.limit || process.env.TELEGRAM_CRON_LIMIT || 50
    });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

function bearerToken(req) {
  const value = req.get("authorization") || "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

module.exports = { cron, scrape, status };
