const priceAlertRepository = require("../repositories/priceAlertRepository");
const { sendCreated, sendSuccess } = require("../utils/responses");

async function createPriceAlert(req, res, next) {
  try {
    const alert = await priceAlertRepository.createPriceAlert(req.body);
    return sendCreated(res, alert);
  } catch (error) {
    next(error);
  }
}

async function getPriceAlerts(req, res, next) {
  try {
    const userId = req.params.userId || req.query?.userId || req.query?.user_id;
    const alerts = await priceAlertRepository.getPriceAlerts(userId);
    return sendSuccess(res, alerts);
  } catch (error) {
    next(error);
  }
}

async function removePriceAlert(req, res, next) {
  try {
    const alert = await priceAlertRepository.removePriceAlert(req.params.userId, req.params.dealId);
    return sendSuccess(res, alert);
  } catch (error) {
    next(error);
  }
}

module.exports = { createPriceAlert, getPriceAlerts, removePriceAlert };
