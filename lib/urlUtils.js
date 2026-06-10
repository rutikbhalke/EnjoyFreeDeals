const HOMEPAGE_HOSTS = new Set([
  "amazon.in",
  "www.amazon.in",
  "flipkart.com",
  "www.flipkart.com",
  "meesho.com",
  "www.meesho.com",
  "myntra.com",
  "www.myntra.com",
  "ajio.com",
  "www.ajio.com",
  "croma.com",
  "www.croma.com",
  "nykaa.com",
  "www.nykaa.com",
  "tatacliq.com",
  "www.tatacliq.com"
]);

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

function isValidUrl(url) {
  return Boolean(normalizeUrl(url));
}

function isHomepageUrl(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    const path = parsed.pathname.replace(/\/+$/, "");
    return HOMEPAGE_HOSTS.has(parsed.hostname.toLowerCase()) && (path === "" || path === "/");
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
  const name = normalizePlatformKey(platform);

  if (!path || path === "/") return false;

  switch (name) {
    case "amazon":
      return /\/(?:dp|gp\/product)\/[a-z0-9]{8,}/i.test(path);
    case "flipkart":
      return host.includes("flipkart.") && (path.includes("/p/") || /\/itm[a-z0-9]+/i.test(path));
    case "meesho":
      return host.includes("meesho.") && /\/p\/[a-z0-9]+/i.test(path);
    case "myntra":
      return host.includes("myntra.") && (path.includes("/buy") || path.includes("/product/") || /\/\d+\/buy/i.test(path));
    case "ajio":
      return host.includes("ajio.") && path.includes("/p/");
    case "croma":
      return host.includes("croma.") && path.includes("/p/");
    case "nykaa":
      return host.includes("nykaa.") && path.includes("/p/");
    case "tatacliq":
      return host.includes("tatacliq.") && /\/p-/i.test(path);
    case "shopsy":
      return host.includes("shopsy.") && (path.includes("/p/") || /\/itm/i.test(path));
    case "reliancedigital":
      return host.includes("reliancedigital.") && (path.includes("/p/") || /\/[a-z0-9-]+\/p\/[a-z0-9]+/i.test(path));
    case "jiomart":
      return host.includes("jiomart.") && path.split("/").filter(Boolean).length >= 3;
    case "bigbasket":
      return host.includes("bigbasket.") && (path.includes("/pd/") || path.includes("/p/"));
    case "blinkit":
      return host.includes("blinkit.") && path.split("/").filter(Boolean).length >= 2;
    case "zepto":
      return (host.includes("zepto.") || host.includes("zeptonow.")) && path.split("/").filter(Boolean).length >= 2;
    case "swiggyinstamart":
      return host.includes("swiggy.") && path.includes("instamart") && path.split("/").filter(Boolean).length >= 2;
    case "firstcry":
      return host.includes("firstcry.") && path.split("/").filter(Boolean).length >= 2;
    case "mamaearth":
      return host.includes("mamaearth.") && path.split("/").filter(Boolean).length >= 2;
    case "purplle":
      return host.includes("purplle.") && path.split("/").filter(Boolean).length >= 2;
    case "boat":
      return host.includes("boat-lifestyle.") && path.includes("/products/");
    case "noise":
      return host.includes("gonoise.") && path.includes("/products/");
    case "samsung":
      return host.includes("samsung.") && path.split("/").filter(Boolean).length >= 3;
    case "apple":
      return host.includes("apple.") && path.split("/").filter(Boolean).length >= 2;
    case "oneplus":
      return host.includes("oneplus.") && path.split("/").filter(Boolean).length >= 2;
    case "realme":
      return host.includes("realme.") && path.split("/").filter(Boolean).length >= 2;
    case "mi":
      return (host.includes("mi.") || host.includes("xiaomi.")) && path.split("/").filter(Boolean).length >= 2;
    case "adidas":
      return host.includes("adidas.") && path.split("/").filter(Boolean).length >= 2;
    case "nike":
      return host.includes("nike.") && path.split("/").filter(Boolean).length >= 2;
    case "puma":
      return host.includes("puma.") && path.split("/").filter(Boolean).length >= 2;
    case "decathlon":
      return host.includes("decathlon.") && path.split("/").filter(Boolean).length >= 2;
    default:
      return path.split("/").filter(Boolean).length >= 2 && !/^\/(?:search|s|category|categories|collections?)\/?$/i.test(path);
  }
}

function normalizePlatformKey(platform) {
  return String(platform || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

module.exports = {
  isActualProductUrl,
  isHomepageUrl,
  isValidUrl,
  normalizeUrl
};
