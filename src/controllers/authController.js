const authRepository = require("../repositories/authRepository");
const { sendCreated, sendSuccess } = require("../utils/responses");

async function register(req, res, next) {
  try {
    const authResult = await authRepository.register(req.body);
    return sendCreated(res, authResult);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const authResult = await authRepository.login(req.body);
    return sendSuccess(res, authResult);
  } catch (error) {
    next(error);
  }
}

async function sendPasswordReset(req, res, next) {
  try {
    const result = await authRepository.sendPasswordReset(req.body);
    return sendSuccess(res, result);
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

module.exports = { register, login, sendPasswordReset, me };
