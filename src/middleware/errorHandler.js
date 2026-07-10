function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const hideEnvDetails = error.code === "ENV_VALIDATION_FAILED" && isProduction();
  const body = {
    success: false,
    message: hideEnvDetails
      ? "Server configuration is incomplete. Please contact support."
      : error.message || "Internal server error."
  };

  if (error.code) body.code = error.code;
  if (error.details && !hideEnvDetails) body.details = error.details;

  return res.status(statusCode).json(body);
}

function isProduction() {
  return /^production$/i.test(String(process.env.APP_ENV || process.env.NODE_ENV || ""));
}

module.exports = { errorHandler };
