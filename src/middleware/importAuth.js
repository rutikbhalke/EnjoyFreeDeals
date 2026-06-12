function requireImportAccess(req, res, next) {
  const expectedSecret = process.env.IMPORT_SECRET || process.env.TELEGRAM_IMPORT_SECRET || process.env.IMPORT_DEALS_CRON_SECRET || "";
  const actualSecret = req.get("x-import-secret") || String(req.query.secret || "");

  if (expectedSecret && actualSecret === expectedSecret) {
    return next();
  }

  if (!expectedSecret && isLocalRequest(req)) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Import secret is required."
  });
}

function isLocalRequest(req) {
  const ip = String(req.ip || req.socket?.remoteAddress || "");
  return ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.includes("localhost");
}

module.exports = { requireImportAccess };
