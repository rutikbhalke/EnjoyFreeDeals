const wishlistRepository = require("../repositories/wishlistRepository");
const { sendCreated, sendSuccess } = require("../utils/responses");

async function addWishlistItem(req, res, next) {
  try {
    const item = await wishlistRepository.addToWishlist(req.body);
    return sendCreated(res, item);
  } catch (error) {
    next(error);
  }
}

async function getWishlist(req, res, next) {
  try {
    const items = await wishlistRepository.getWishlist(req.params.userId);
    return sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
}

async function removeWishlistItem(req, res, next) {
  try {
    const result = await wishlistRepository.removeFromWishlist(req.params.userId, req.params.dealId);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = { addWishlistItem, getWishlist, removeWishlistItem };
