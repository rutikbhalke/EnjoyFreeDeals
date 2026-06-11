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

function buildSearchUrl(platform, productName) {
  const query = String(productName || "").trim();
  if (!query) return "";
  const encoded = encodeURIComponent(query);
  const key = String(platform || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  switch (key) {
    case "amazon":
      return `https://www.amazon.in/s?k=${encoded}`;
    case "flipkart":
      return `https://www.flipkart.com/search?q=${encoded}`;
    case "meesho":
      return `https://www.meesho.com/search?q=${encoded}`;
    case "myntra":
      return `https://www.myntra.com/${encoded.replace(/%20/g, "-").toLowerCase()}`;
    case "ajio":
      return `https://www.ajio.com/search/?text=${encoded}`;
    case "croma":
      return `https://www.croma.com/searchB?q=${encoded}`;
    case "nykaa":
      return `https://www.nykaa.com/search/result/?q=${encoded}`;
    case "tatacliq":
      return `https://www.tatacliq.com/search/?searchCategory=all&text=${encoded}`;
    case "jiomart":
      return `https://www.jiomart.com/search/${encoded}`;
    case "reliancedigital":
      return `https://www.reliancedigital.in/search?q=${encoded}`;
    case "bigbasket":
      return `https://www.bigbasket.com/ps/?q=${encoded}`;
    case "boat":
      return `https://www.boat-lifestyle.com/search?q=${encoded}`;
    case "noise":
      return `https://www.gonoise.com/search?q=${encoded}`;
    case "purplle":
      return `https://www.purplle.com/search?q=${encoded}`;
    case "decathlon":
      return `https://www.decathlon.in/search?query=${encoded}`;
    case "puma":
      return `https://in.puma.com/in/en/search?q=${encoded}`;
    case "adidas":
      return `https://www.adidas.co.in/search?q=${encoded}`;
    case "nike":
      return `https://www.nike.com/in/w?q=${encoded}`;
    default:
      return `https://www.google.com/search?q=${encoded}+${encodeURIComponent(platform)}+price`;
  }
}

module.exports = { buildSearchUrl, isActualProductUrl, isHomepageUrl, normalizeUrl };
