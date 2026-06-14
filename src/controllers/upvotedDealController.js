const upvotedDealRepository = require("../repositories/upvotedDealRepository");

async function getUpvotedDeals(req, res, next) {
  try {
    const result = await upvotedDealRepository.getUpvotedDeals(req.query.userId || req.query.user_id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function upvoteDeal(req, res, next) {
  try {
    const result = await upvotedDealRepository.upvoteDeal({
      ...req.body,
      ipHash: req.body?.ipHash || req.body?.ip_hash || upvotedDealRepository.hashRequestIp(req)
    });
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function removeUpvote(req, res, next) {
  try {
    const result = await upvotedDealRepository.removeUpvote({
      ...req.body,
      ipHash: req.body?.ipHash || req.body?.ip_hash || upvotedDealRepository.hashRequestIp(req)
    });
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUpvotedDeals,
  removeUpvote,
  upvoteDeal
};
