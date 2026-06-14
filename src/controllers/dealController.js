const dealRepository = require("../repositories/dealRepository");
const priceHistoryRepository = require("../repositories/priceHistoryRepository");
const upvotedDealRepository = require("../repositories/upvotedDealRepository");
const { sendCreated, sendSuccess } = require("../utils/responses");

async function getDeals(req, res, next) {
  try {
    const result = await dealRepository.listDeals(req.query);
    return sendSuccess(res, result.deals, { pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

async function getDealById(req, res, next) {
  try {
    const deal = await dealRepository.getDealById(
      req.params.id,
      req.query.userId || req.query.user_id,
      req.query.guestId || req.query.guest_id
    );
    if (!deal) {
      return res.status(404).json({ success: false, message: "Deal not found." });
    }
    return sendSuccess(res, deal);
  } catch (error) {
    next(error);
  }
}

async function getPriceHistory(req, res, next) {
  try {
    const history = await priceHistoryRepository.listPriceHistory(req.params.id);
    return sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
}

async function upvoteDeal(req, res, next) {
  try {
    const result = await upvotedDealRepository.upvoteDeal({
      ...req.body,
      dealId: req.params.id,
      ipHash: req.body?.ipHash || req.body?.ip_hash || upvotedDealRepository.hashRequestIp(req)
    });
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getDealUpvotes(req, res, next) {
  try {
    const result = await upvotedDealRepository.getDealUpvotes(req.params.id, {
      ...req.query,
      ipHash: req.query?.ipHash || req.query?.ip_hash || upvotedDealRepository.hashRequestIp(req)
    });
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function createDeal(req, res, next) {
  try {
    const deal = await dealRepository.createDeal(req.body);
    return sendCreated(res, deal);
  } catch (error) {
    next(error);
  }
}

async function updateDeal(req, res, next) {
  try {
    const deal = await dealRepository.updateDeal(req.params.id, req.body);
    return sendSuccess(res, deal);
  } catch (error) {
    next(error);
  }
}

async function deleteDeal(req, res, next) {
  try {
    const deal = await dealRepository.softDeleteDeal(req.params.id);
    return sendSuccess(res, deal);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDeals,
  getDealById,
  getDealUpvotes,
  getPriceHistory,
  createDeal,
  updateDeal,
  upvoteDeal,
  deleteDeal
};
