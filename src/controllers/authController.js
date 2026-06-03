const authRepository = require("../repositories/authRepository");
const { sendSuccess } = require("../utils/responses");

async function requestWhatsAppOtp(req, res, next) {
  try {
    const result = await authRepository.requestWhatsAppOtp(req.body);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

async function verifyWhatsAppOtp(req, res, next) {
  try {
    const authResult = await authRepository.verifyWhatsAppOtp(req.body);
    return sendSuccess(res, authResult);
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const token = getBearerToken(req);
    const result = await authRepository.getCurrentUser(token);
    return sendSuccess(res, result.user);
  } catch (error) {
    next(error);
  }
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

module.exports = { requestWhatsAppOtp, verifyWhatsAppOtp, me };
