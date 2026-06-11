const priceHistoryRepository = require("../repositories/priceHistoryRepository");

async function getPriceHistory(req, res, next) {
  try {
    const productId = String(req.query.productId || req.query.product_id || "").trim();
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required."
      });
    }

    const summary = await priceHistoryRepository.getPriceHistorySummary(productId);
    return res.json({
      success: true,
      ...summary
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPriceHistory };
