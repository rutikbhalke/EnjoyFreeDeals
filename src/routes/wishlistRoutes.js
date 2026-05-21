const express = require("express");
const wishlistController = require("../controllers/wishlistController");

const router = express.Router();

router.post("/", wishlistController.addWishlistItem);
router.get("/:userId", wishlistController.getWishlist);
router.delete("/:userId/:dealId", wishlistController.removeWishlistItem);

module.exports = router;
