const recentlyViewedRepository = require("../repositories/recentlyViewedRepository");
const { sendCreated, sendSuccess } = require("../utils/responses");

async function recordRecentlyViewed(req, res, next) {
  try {
    const item = await recentlyViewedRepository.recordRecentlyViewed(req.body);
    return sendCreated(res, item);
  } catch (error) {
    next(error);
  }
}

async function getRecentlyViewed(req, res, next) {
  try {
    const items = await recentlyViewedRepository.getRecentlyViewed(req.params.userId);
    return sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
}

module.exports = { getRecentlyViewed, recordRecentlyViewed };
