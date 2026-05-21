const priceComparisonRepository = require("../repositories/priceComparisonRepository");
const { sendSuccess } = require("../utils/responses");

async function getPriceComparisons(_req, res, next) {
  try {
    const comparisons = await priceComparisonRepository.listPriceComparisons();
    return sendSuccess(res, comparisons);
  } catch (error) {
    next(error);
  }
}

async function getPriceComparison(req, res, next) {
  try {
    const comparison = await priceComparisonRepository.getPriceComparison(req.params.productId);
    if (!comparison) {
      return res.status(404).json({ success: false, message: "Price comparison not found." });
    }
    return sendSuccess(res, comparison);
  } catch (error) {
    next(error);
  }
}

module.exports = { getPriceComparison, getPriceComparisons };
