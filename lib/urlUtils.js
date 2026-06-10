const TRACKING_PARAMS = [
  "tag",
  "ascsubtag",
  "affid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term"
];

function normalizeUrl(url) {
  const value = String(url || "").trim();
  if (!/^https?:\/\//i.test(value)) return "";
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    TRACKING_PARAMS.forEach((key) => parsed.searchParams.delete(key));
    if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function isHomepageUrl(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    const path = parsed.pathname.replace(/\/+$/, "");
    return path === "" || path === "/";
  } catch {
    return false;
  }
}

function isActualProductUrl(platform, url) {
  const normalized = normalizeUrl(url);
  if (!normalized || isHomepageUrl(normalized)) return false;
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  const path = decodeURIComponent(parsed.pathname || "").toLowerCase();
  const key = String(platform || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

  switch (key) {
    case "amazon":
      return /\/(?:dp|gp\/product)\/[a-z0-9]{8,}/i.test(path);
    case "flipkart":
      return host.includes("flipkart.") && (path.includes("/p/") || /\/itm/i.test(path));
    case "meesho":
      return host.includes("meesho.") && path.includes("/p/");
    case "myntra":
      return host.includes("myntra.") && (path.includes("/buy") || path.includes("/product/"));
    case "ajio":
    case "croma":
    case "nykaa":
      return path.includes("/p/");
    case "tatacliq":
      return path.includes("/p-");
    default:
      return path.split("/").filter(Boolean).length >= 2;
  }
}

module.exports = { isActualProductUrl, isHomepageUrl, normalizeUrl };
