const express = require("express");
const priceComparisonController = require("../controllers/priceComparisonController");

const router = express.Router();

router.get("/", priceComparisonController.getPriceComparisons);
router.get("/:productId", priceComparisonController.getPriceComparison);

module.exports = router;
