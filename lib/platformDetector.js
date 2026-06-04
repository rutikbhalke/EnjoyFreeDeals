const SUPPORTED_PLATFORMS = [
  { name: "Amazon", patterns: [/amazon\.in/i, /amzn\.to/i] },
  { name: "Flipkart", patterns: [/flipkart\.com/i, /fkrt\.it/i] },
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

module.exports = { SUPPORTED_PLATFORMS, detectPlatform, isSupportedPlatform };
