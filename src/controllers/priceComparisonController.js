const priceComparisonRepository = require("../repositories/priceComparisonRepository");
const { sendSuccess } = require("../utils/responses");

async function getPriceComparisons(req, res, next) {
  try {
    const productId = String(req.query.productId || req.query.product_id || "").trim();
    if (productId) {
      const comparison = await priceComparisonRepository.getPriceComparisonSummary(productId);
      if (!comparison) {
        return res.status(404).json({ success: false, message: "No price comparison found" });
      }
      return res.json({ success: true, ...comparison });
    }
    const comparisons = await priceComparisonRepository.listPriceComparisons();
    return sendSuccess(res, comparisons);
  } catch (error) {
    next(error);
  }
}

async function getPriceComparison(req, res, next) {
  try {
    const comparison = await priceComparisonRepository.getPriceComparisonSummary(req.params.productId);
    if (!comparison) {
      return res.status(404).json({ success: false, message: "No price comparison found" });
    }
    return res.json({ success: true, ...comparison });
  } catch (error) {
    next(error);
  }
}

async function savePriceComparison(req, res, next) {
  try {
    const productId = String(req.body?.product_id || req.body?.productId || "").trim();
    const prices = Array.isArray(req.body?.prices) ? req.body.prices : [];
    const comparison = await priceComparisonRepository.savePriceComparison(productId, prices);
    return res.json({ success: true, ...comparison });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPriceComparison, getPriceComparisons, savePriceComparison };
