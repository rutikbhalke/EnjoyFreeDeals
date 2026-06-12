const express = require("express");
const upvotedDealController = require("../controllers/upvotedDealController");

const router = express.Router();

router.get("/", upvotedDealController.getUpvotedDeals);
router.post("/", upvotedDealController.upvoteDeal);
router.delete("/", upvotedDealController.removeUpvote);

module.exports = router;
