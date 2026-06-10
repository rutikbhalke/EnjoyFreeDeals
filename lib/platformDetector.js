const SHORT_LINK_HOSTS = new Set(["amzn.to", "fkrt.it", "bit.ly", "tinyurl.com", "cutt.ly", "bitli.in"]);

const SUPPORTED_PLATFORMS = [
  { name: "Amazon", patterns: [/amazon\.(?:in|com)/i, /amzn\.to/i] },
  { name: "Flipkart", patterns: [/flipkart\.com/i, /fkrt\.it/i, /dl\.flipkart\.com/i] },
  { name: "Meesho", patterns: [/meesho\.com/i] },
  { name: "Myntra", patterns: [/myntra\.com/i, /myntr\.in/i] },
  { name: "Ajio", patterns: [/ajio\.com/i] },
  { name: "TataCliq", patterns: [/tatacliq\.com/i] },
  { name: "Croma", patterns: [/croma\.com/i] },
  { name: "Nykaa", patterns: [/nykaa\.com/i] },
  { name: "Snapdeal", patterns: [/snapdeal\.com/i] },
  { name: "Shopsy", patterns: [/shopsy\.(?:in|com)/i] },
  { name: "Reliance Digital", patterns: [/reliancedigital\.in/i] },
  { name: "Vijay Sales", patterns: [/vijaysales\.com/i] },
  { name: "JioMart", patterns: [/jiomart\.com/i] },
  { name: "BigBasket", patterns: [/bigbasket\.com/i] },
  { name: "Blinkit", patterns: [/blinkit\.com/i] },
  { name: "Zepto", patterns: [/zeptonow\.com/i, /zepto\.com/i] },
  { name: "Swiggy Instamart", patterns: [/swiggy\.com\/instamart/i, /\binstamart\b/i] },
  { name: "FirstCry", patterns: [/firstcry\.com/i] },
  { name: "Mamaearth", patterns: [/mamaearth\.in/i] },
  { name: "Purplle", patterns: [/purplle\.com/i] },
  { name: "Boat", patterns: [/boat-lifestyle\.com/i] },
  { name: "Noise", patterns: [/gonoise\.com/i] },
  { name: "Samsung", patterns: [/samsung\.com/i] },
  { name: "Apple", patterns: [/apple\.com(?:\/in)?/i] },
  { name: "OnePlus", patterns: [/oneplus\.(?:in|com)/i] },
  { name: "Realme", patterns: [/realme\.com/i] },
  { name: "Mi", patterns: [/mi\.com/i, /xiaomi\.com/i] },
  { name: "Adidas", patterns: [/adidas\.(?:co\.in|com)/i] },
  { name: "Nike", patterns: [/nike\.com(?:\/in)?/i] },
  { name: "Puma", patterns: [/in\.puma\.com/i, /puma\.com/i] },
  { name: "Decathlon", patterns: [/decathlon\.in/i] },
  { name: "Paytm", patterns: [/paytm\.com/i] },
  { name: "PhonePe", patterns: [/phonepe\.com/i] },
  { name: "Freecharge", patterns: [/freecharge\.in/i] }
];

function detectPlatform(text) {
  const value = String(text || "");
  const match = SUPPORTED_PLATFORMS.find((platform) =>
    platform.patterns.some((pattern) => pattern.test(value))
  );
  return match?.name || "";
}

function isSupportedPlatform(platform) {
  return Boolean(normalizePlatformName(platform));
}

function normalizePlatformName(platform) {
  const key = normalizeKey(platform);
  return SUPPORTED_PLATFORMS.find((item) => normalizeKey(item.name) === key)?.name || "";
}

async function detectPlatformFromTextAndUrl(text, url) {
  const resolvedUrl = await expandShortUrl(url);
  const resolvedPlatform = detectPlatform(`${text || ""} ${resolvedUrl || ""}`);
  if (resolvedPlatform) return { platform: resolvedPlatform, resolvedUrl: resolvedUrl || url || "" };

  const directPlatform = detectPlatform(`${text || ""} ${url || ""}`);
  if (directPlatform) return { platform: directPlatform, resolvedUrl: url || "" };

  return {
    platform: detectPlatform(`${text || ""} ${resolvedUrl}`),
    resolvedUrl: resolvedUrl || url || ""
  };
}

async function expandShortUrl(value) {
  if (!value || !isShortLink(value)) return value || "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.URL_EXPAND_TIMEOUT_MS || 5000));
  try {
    const response = await fetch(value, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "EnjoyFreeDealsBot/1.0 (+https://enjoyfreedeals.vercel.app)"
      }
    });
    return response.url || value;
  } catch {
    return value;
  } finally {
    clearTimeout(timeout);
  }
}

function isShortLink(value) {
  try {
    const parsed = new URL(value);
    return SHORT_LINK_HOSTS.has(parsed.hostname.replace(/^www\./, "").toLowerCase());
  } catch {
    return false;
  }
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

module.exports = { SUPPORTED_PLATFORMS, detectPlatform, detectPlatformFromTextAndUrl, expandShortUrl, isSupportedPlatform, normalizePlatformName };
