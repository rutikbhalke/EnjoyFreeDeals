const healthRepository = require("../repositories/healthRepository");
const { sendSuccess } = require("../utils/responses");

async function getSupabaseHealth(_req, res, next) {
  try {
    const status = await healthRepository.checkSupabase();
    return sendSuccess(res, status);
  } catch (error) {
    next(error);
  }
}

module.exports = { getSupabaseHealth };
