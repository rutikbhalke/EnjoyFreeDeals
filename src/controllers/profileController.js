const profileRepository = require("../repositories/profileRepository");
const { sendSuccess } = require("../utils/responses");

async function getProfile(req, res, next) {
  try {
    const profile = await profileRepository.getProfile(req.params.userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found." });
    }
    return sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await profileRepository.updateProfile(req.params.userId, req.body);
    return sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
}

module.exports = { getProfile, updateProfile };
