const express = require("express");
const dealController = require("../controllers/dealController");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", dealController.getDeals);
router.get("/:id/price-history", dealController.getPriceHistory);
router.get("/:id", dealController.getDealById);
router.post("/", requireAdmin, dealController.createDeal);
router.put("/:id", requireAdmin, dealController.updateDeal);
router.delete("/:id", requireAdmin, dealController.deleteDeal);

module.exports = router;
