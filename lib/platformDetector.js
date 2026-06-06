const SHORT_LINK_HOSTS = new Set(["amzn.to", "fkrt.it", "bit.ly", "tinyurl.com"]);

const SUPPORTED_PLATFORMS = [
  { name: "Amazon", patterns: [/amazon\.(?:in|com)/i, /amzn\.to/i] },
  { name: "Flipkart", patterns: [/flipkart\.com/i, /fkrt\.it/i, /dl\.flipkart\.com/i] },
  { name: "Meesho", patterns: [/meesho\.com/i] },
  { name: "Myntra", patterns: [/myntra\.com/i, /myntr\.in/i] },
  { name: "Ajio", patterns: [/ajio\.com/i] },
  { name: "TataCliq", patterns: [/tatacliq\.com/i] },
  { name: "Croma", patterns: [/croma\.com/i] },
  { name: "Nykaa", patterns: [/nykaa\.com/i] },
  { name: "Snapdeal", patterns: [/snapdeal\.com/i] }
];

function detectPlatform(text) {
  const value = String(text || "");
  const match = SUPPORTED_PLATFORMS.find((platform) =>
    platform.patterns.some((pattern) => pattern.test(value))
  );
  return match?.name || "";
}

function isSupportedPlatform(platform) {
  return SUPPORTED_PLATFORMS.some((item) => item.name.toLowerCase() === String(platform || "").toLowerCase());
}

async function detectPlatformFromTextAndUrl(text, url) {
  const directPlatform = detectPlatform(`${text || ""} ${url || ""}`);
  if (directPlatform) return { platform: directPlatform, resolvedUrl: url || "" };

  const resolvedUrl = await expandShortUrl(url);
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

module.exports = { SUPPORTED_PLATFORMS, detectPlatform, detectPlatformFromTextAndUrl, expandShortUrl, isSupportedPlatform };
