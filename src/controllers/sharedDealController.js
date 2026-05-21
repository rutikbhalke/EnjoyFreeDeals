const sharedDealRepository = require("../repositories/sharedDealRepository");
const { sendCreated, sendSuccess } = require("../utils/responses");

async function addSharedDeal(req, res, next) {
  try {
    const item = await sharedDealRepository.addSharedDeal(req.body);
    return sendCreated(res, item);
  } catch (error) {
    next(error);
  }
}

async function getSharedDeals(req, res, next) {
  try {
    const items = await sharedDealRepository.getSharedDeals(req.params.userId);
    return sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
}

module.exports = { addSharedDeal, getSharedDeals };
