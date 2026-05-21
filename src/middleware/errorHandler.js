function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const body = {
    success: false,
    message: error.message || "Internal server error."
  };

  if (error.code) body.code = error.code;
  if (error.details) body.details = error.details;

  return res.status(statusCode).json(body);
}

module.exports = { errorHandler };
