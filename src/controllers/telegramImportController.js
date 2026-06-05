const { enrichGenieLootDetails } = require("../services/dealDetailEnricher");
const {
  getTelegramStatus,
  importTelegramDeals,
  scrapeGenieLootPage
} = require("../services/telegramDealImporter");
const { sendSuccess } = require("../utils/responses");

const backgroundJobs = new Map();

async function importDeals(req, res, next) {
  try {
    const result = await importTelegramDeals();
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function status(req, res, next) {
  try {
    const result = await getTelegramStatus();
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function scrapePage(req, res, next) {
  try {
    if (isBackgroundRequest(req)) {
      const job = startBackgroundJob("scrape-genie-loot", () => scrapeGenieLootPage({
        pageUrl: req.query.url,
        pageUrls: req.query.urls,
        maxPages: req.query.maxPages
      }));
      return sendAccepted(res, backgroundJobResponse(job));
    }

    const result = await scrapeGenieLootPage({
      pageUrl: req.query.url,
      pageUrls: req.query.urls,
      maxPages: req.query.maxPages
    });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function enrichDetails(req, res, next) {
  try {
    const options = enrichmentOptions(req.query);
    if (isBackgroundRequest(req)) {
      const job = startBackgroundJob("enrich-genie-loot", () => enrichGenieLootDetails(options));
      return sendAccepted(res, backgroundJobResponse(job));
    }

    const result = await enrichGenieLootDetails(options);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function syncGenieLoot(req, res, next) {
  try {
    const scrapeOptions = {
      pageUrl: req.query.url,
      pageUrls: req.query.urls,
      maxPages: req.query.maxPages || 100
    };
    const enrichOptions = enrichmentOptions({
      ...req.query,
      limit: req.query.limit || 1000
    });

    if (!isBlockingRequest(req)) {
      const job = startBackgroundJob("sync-genie-loot", async () => {
        const scrape = await scrapeGenieLootPage(scrapeOptions);
        const enrich = await enrichGenieLootDetails(enrichOptions);
        return { scrape, enrich };
      });
      return sendAccepted(res, backgroundJobResponse(job));
    }

    const scrape = await scrapeGenieLootPage(scrapeOptions);
    const enrich = await enrichGenieLootDetails(enrichOptions);
    return sendSuccess(res, { scrape, enrich });
  } catch (error) {
    next(error);
  }
}

async function scrapeAllDeals(req, res, next) {
  try {
    const scrapeOptions = {
      pageUrl: req.query.url,
      pageUrls: req.query.urls,
      maxPages: req.query.maxPages || 100,
      bestFraction: req.query.bestFraction
    };
    const enrichOptions = enrichmentOptions({
      ...req.query,
      limit: req.query.limit || 1500
    });
    const includeBot = isTruthy(req.query.includeBot);

    const runner = async () => {
      const steps = [];

      if (includeBot) {
        steps.push(await runScrapeStep("telegram-bot", () => importTelegramDeals()));
      }

      steps.push(await runScrapeStep("telegram-pages", () => scrapeGenieLootPage(scrapeOptions)));
      steps.push(await runScrapeStep("product-page-enrichment", () => enrichGenieLootDetails(enrichOptions)));

      const failed = steps.filter((step) => step.status === "failed");
      const imported = steps.reduce((total, step) => total + Number(step.result?.imported || 0), 0);
      const updated = steps.reduce((total, step) => total + Number(step.result?.updated || 0), 0);
      const enriched = steps.reduce((total, step) => total + Number(step.result?.enriched || 0), 0);

      return {
        message: failed.length
          ? `Scrape all finished with ${failed.length} failed step(s). Check steps for details.`
          : "Scrape all finished. Fresh deals are ready from /api/deals.",
        imported,
        updated,
        enriched,
        steps
      };
    };

    if (!isBlockingRequest(req)) {
      const job = startBackgroundJob("scrape-all-deals", runner);
      return sendAccepted(res, backgroundJobResponse(job));
    }

    return sendSuccess(res, await runner());
  } catch (error) {
    next(error);
  }
}

function jobStatus(req, res) {
  const id = String(req.params.id || req.query.id || "");
  const job = backgroundJobs.get(id);
  if (!job) {
    return res.status(404).json({ success: false, message: "Background job not found." });
  }

  return sendSuccess(res, backgroundJobResponse(job));
}

function enrichmentOptions(query) {
  const quick = isTruthy(query.quick) || !isTruthy(query.blocking);
  return {
    limit: query.limit,
    concurrency: query.concurrency || (quick ? 20 : undefined),
    timeoutMs: query.timeoutMs || (quick ? 2000 : undefined)
  };
}

async function runScrapeStep(name, runner) {
  try {
    return {
      name,
      status: "success",
      result: await runner(),
      error: ""
    };
  } catch (error) {
    return {
      name,
      status: "failed",
      result: null,
      error: error instanceof Error ? error.message : "Step failed."
    };
  }
}

function startBackgroundJob(type, runner) {
  const id = `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const job = {
    id,
    type,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    result: null,
    error: ""
  };
  backgroundJobs.set(id, job);

  Promise.resolve()
    .then(runner)
    .then((result) => {
      job.status = "complete";
      job.result = result;
      job.finishedAt = new Date().toISOString();
    })
    .catch((error) => {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Background job failed.";
      job.finishedAt = new Date().toISOString();
    });

  return job;
}

function backgroundJobResponse(job) {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    result: job.result,
    error: job.error,
    statusUrl: `http://127.0.0.1:5000/api/admin/genie-loot-jobs/${job.id}`
  };
}

function sendAccepted(res, data) {
  return res.status(202).json({ success: true, data });
}

function isBackgroundRequest(req) {
  return isTruthy(req.query.background) || isTruthy(req.query.async);
}

function isFastRequest(req) {
  return isTruthy(req.query.fast);
}

function isBlockingRequest(req) {
  return isTruthy(req.query.blocking) && !isFastRequest(req) && !isBackgroundRequest(req);
}

function isTruthy(value) {
  return ["1", "true", "yes", "y", "on"].includes(String(value || "").toLowerCase());
}

module.exports = { enrichDetails, importDeals, jobStatus, scrapeAllDeals, scrapePage, status, syncGenieLoot };
