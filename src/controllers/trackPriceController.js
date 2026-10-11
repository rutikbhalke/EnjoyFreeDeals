const trackPriceRepository = require("../repositories/trackPriceRepository");

async function trackPrice(req, res, next) {
  try {
    const productUrl = String(req.body?.productUrl || req.body?.product_url || req.query?.productUrl || req.query?.product_url || req.query?.url || "").trim();
    const userId = req.body?.userId || req.body?.user_id || req.query?.userId || req.query?.user_id || null;
    const result = await trackPriceRepository.trackProductPrice(productUrl, userId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { trackPrice };
