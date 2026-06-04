function normalizeProductTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(deal|offer|sale|discount|coupon|with|for|the|new|latest)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeKey({ platform, productTitle, productUrl }) {
  const normalizedUrl = String(productUrl || "").toLowerCase().replace(/[?#].*$/, "");
  return `${String(platform || "").toLowerCase()}|${normalizedUrl || normalizeProductTitle(productTitle)}`;
}

module.exports = { dedupeKey, normalizeProductTitle };
