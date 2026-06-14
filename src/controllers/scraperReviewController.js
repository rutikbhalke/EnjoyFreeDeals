const scraperReviewRepository = require("../repositories/scraperReviewRepository");
const { sendSuccess } = require("../utils/responses");

async function listScrapedDeals(req, res, next) {
  try {
    const result = await scraperReviewRepository.listScrapedDeals(req.query);
    return sendSuccess(res, result.items, { pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

async function approveScrapedDeal(req, res, next) {
  try {
    const result = await scraperReviewRepository.approveScrapedDeal(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function rejectScrapedDeal(req, res, next) {
  try {
    const result = await scraperReviewRepository.rejectScrapedDeal(req.params.id, req.body?.reason);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function listTelegramDeals(req, res, next) {
  try {
    const result = await scraperReviewRepository.listTelegramDeals(req.query);
    return sendSuccess(res, result.items, { pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

async function listScrapeLogs(req, res, next) {
  try {
    const result = await scraperReviewRepository.listScrapeLogs(req.query);
    return sendSuccess(res, result.items, { pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

async function listFlaggedDeals(req, res, next) {
  try {
    const result = await scraperReviewRepository.listFlaggedDeals(req.query);
    return res.json({
      success: true,
      items: result.items,
      summary: result.summary,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

async function updateAdminDeal(req, res, next) {
  try {
    const result = await scraperReviewRepository.updateAdminDeal(req.params.id, req.body || {}, req.adminUser);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function approveAdminDeal(req, res, next) {
  try {
    const result = await scraperReviewRepository.approveAdminDeal(req.params.id, req.body || {}, req.adminUser);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function rejectAdminDeal(req, res, next) {
  try {
    const result = await scraperReviewRepository.rejectAdminDeal(req.params.id, req.body?.rejectedReason || req.body?.reason || "", req.adminUser);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function flagAdminDeal(req, res, next) {
  try {
    const result = await scraperReviewRepository.flagAdminDeal(req.params.id, req.body?.reason || req.body?.flag || "", req.adminUser);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function updateManualPrice(req, res, next) {
  try {
    const result = await scraperReviewRepository.updateManualPrice(req.params.id, req.body || {});
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function updateManualExpiry(req, res, next) {
  try {
    const result = await scraperReviewRepository.updateManualExpiry(req.params.id, req.body || {});
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function markTelegramDealExpired(req, res, next) {
  try {
    const result = await scraperReviewRepository.markTelegramDealExpired(req.params.id, req.body?.reason || req.body?.note || "");
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  approveAdminDeal,
  approveScrapedDeal,
  flagAdminDeal,
  listFlaggedDeals,
  listScrapedDeals,
  rejectScrapedDeal,
  rejectAdminDeal,
  listScrapeLogs,
  listTelegramDeals,
  markTelegramDealExpired,
  updateAdminDeal,
  updateManualExpiry,
  updateManualPrice
};
