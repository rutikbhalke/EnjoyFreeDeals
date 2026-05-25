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

module.exports = {
  approveScrapedDeal,
  listScrapedDeals,
  rejectScrapedDeal
};
