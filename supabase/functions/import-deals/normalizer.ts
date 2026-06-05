import type { DealSourceRow, NormalizedDeal, SourceDeal, ValidationResult } from "./types.ts";

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "affid",
  "tag",
  "ref"
];

export function normalizeSourceDeal(source: DealSourceRow, item: SourceDeal): NormalizedDeal {
  const originalTitle = cleanText(item.title);
  const title = cleanImportedTitle(originalTitle, source.source_name);
  const sourceUrl = canonicalUrl(item.sourceUrl, source.base_url);
  const affiliateLink = item.affiliateUrl || item.sourceUrl || sourceUrl;
  const originalPrice = money(item.originalPrice);
  const discountedPrice = money(item.discountedPrice);
  const discountPercentage = calculateDiscount(originalPrice, discountedPrice);
  const couponCode = cleanText(item.couponCode || "").toUpperCase();
  const dealType = discountedPrice === 0 ? "FREE_DEAL" : couponCode ? "COUPON" : "DISCOUNT";
  const categoryName = cleanText(item.categoryName || "Other Deals");
  const imageUrl = cleanDealImageUrl(item.imageUrl, title, categoryName, source.source_name);
  const identity = item.sourceProductId || sourceUrl || `${source.source_name}:${title}`;
  const dedupeKey = `${source.source_key}:${hashString(normalizeForKey(identity))}`;

  return {
    sourceKey: source.source_key,
    sourceName: source.source_name,
    sourceProductId: cleanText(item.sourceProductId),
    sourceUrl,
    dedupeKey,
    slug: `${slugify(title)}-${hashString(dedupeKey).slice(0, 8)}`,
    title,
    description: cleanImportedDescription(item.description || originalTitle, title, source.source_name),
    storeName: source.source_name,
    storeSlug: slugify(source.source_name),
    storeUrl: canonicalUrl(source.base_url, source.base_url),
    categoryName,
    categorySlug: slugify(categoryName),
    originalPrice,
    discountedPrice,
    discountPercentage,
    dealType,
    couponCode,
    cashbackPercentage: money(item.cashbackPercentage || 0),
    affiliateLink,
    imageUrl,
    expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : null,
    isFeatured: discountPercentage >= 50 || discountedPrice === 0,
    rawPayload: {
      ...(item.raw || {}),
      sourceKey: source.source_key,
      sourceProductId: item.sourceProductId,
      sourceUrl,
      originalTitle,
      comparisonKey: buildComparisonKey(title),
      normalizedAt: new Date().toISOString()
    }
  };
}

export function validateDeal(deal: NormalizedDeal, trustLevel: number): ValidationResult {
  const errors: string[] = [];
  const reviewReasons: string[] = [];

  if (deal.title.length < 4) errors.push("Title is too short.");
  if (deal.title.length > 96) reviewReasons.push("Title is too long and needs review.");
  if (!isHttpUrl(deal.sourceUrl)) errors.push("Source URL is missing or invalid.");
  const canUseAppImageFallback = deal.rawPayload.connectorMode === "telegram-bot" && !deal.imageUrl;
  if (!canUseAppImageFallback && !isHttpUrl(deal.imageUrl)) reviewReasons.push("Image URL is missing or invalid.");
  if (!deal.sourceProductId && !deal.sourceUrl) errors.push("Source product identity is missing.");
  if (deal.originalPrice < 0 || deal.discountedPrice < 0) errors.push("Price cannot be negative.");
  if (deal.originalPrice > 0 && deal.discountedPrice > deal.originalPrice) {
    reviewReasons.push("Discounted price is higher than original price.");
  }
  if (deal.originalPrice > 0 && deal.discountedPrice > 0 && deal.discountPercentage <= 0) {
    reviewReasons.push("No visible discount was detected.");
  }
  if (deal.discountPercentage >= 90 && deal.discountedPrice > 0) {
    reviewReasons.push("Very high discount needs review.");
  }
  if (deal.rawPayload.connectorMode === "html-scrape" && deal.rawPayload.jsonLdFound !== true) {
    reviewReasons.push("Structured product data was not found.");
  }
  if (deal.discountedPrice === 0 && trustLevel < 5) {
    reviewReasons.push("Free deal requires highest trust source.");
  }
  if (deal.expiryDate && new Date(deal.expiryDate).getTime() <= Date.now()) {
    errors.push("Deal is expired.");
  }

  return {
    valid: errors.length === 0,
    errors,
    reviewReasons,
    qualityScore: calculateQualityScore(deal, trustLevel, reviewReasons)
  };
}

export function shouldPublish(validation: ValidationResult, trustLevel: number): boolean {
  return validation.valid &&
    validation.reviewReasons.length === 0 &&
    trustLevel >= 4 &&
    validation.qualityScore >= 80;
}

export function slugify(value: string): string {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "deal";
}

export function canonicalUrl(value: string, baseUrl: string): string {
  try {
    const parsed = new URL(value, baseUrl);
    parsed.hash = "";
    for (const param of TRACKING_PARAMS) parsed.searchParams.delete(param);
    return parsed.toString();
  } catch {
    return "";
  }
}

export function cleanText(value: string): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanDealImageUrl(value: string, title: string, categoryName: string, sourceName: string): string {
  const imageUrl = cleanText(value);
  return isHttpUrl(imageUrl) ? imageUrl : "";
}

function cleanImportedTitle(value: string, sourceName: string): string {
  const original = stripMarketplaceSuffix(cleanText(value), sourceName);
  const color = original.match(/\(([^)]{2,40})\)\s*$/)?.[1] || "";
  let title = original.split(/\s*,\s*/)[0] || original;

  title = title
    .replace(/\s+with\s+.*$/i, "")
    .replace(/\s+(tws|true wireless)\s+.*$/i, "")
    .replace(/\s+wireless\s+earphones?.*$/i, "")
    .trim();

  if (/airdopes|earbuds?|ear buds/i.test(original) && !/earbuds?/i.test(title)) {
    title = `${title} Bluetooth Earbuds`;
  } else if (/smartwatch|smart watch/i.test(original) && !/smartwatch/i.test(title)) {
    title = `${title} Smartwatch`;
  } else if (/speaker/i.test(original) && !/speaker/i.test(title)) {
    title = `${title} Speaker`;
  }

  if (color && !title.toLowerCase().includes(color.toLowerCase()) && title.length + color.length < 90) {
    title = `${title} (${color})`;
  }

  return truncateClean(title, 96);
}

function cleanImportedDescription(value: string, fallbackTitle: string, sourceName: string): string {
  const description = stripMarketplaceSuffix(cleanText(value), sourceName);
  if (!description || description.length > 220) return fallbackTitle;
  return description;
}

function stripMarketplaceSuffix(value: string, sourceName: string): string {
  const escapedSource = sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return value
    .replace(/\s*:\s*Amazon\.in\s*:.*$/i, "")
    .replace(/\s*:\s*Amazon\.in\s*$/i, "")
    .replace(/\s*\|\s*(Amazon\.in|Flipkart|Croma|Myntra|Ajio|TataCliq).*$/i, "")
    .replace(new RegExp(`\\s*[-|:]\\s*${escapedSource}\\b.*$`, "i"), "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateClean(value: string, maxLength: number): string {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength + 1);
  return truncated.slice(0, truncated.lastIndexOf(" ")).trim() || text.slice(0, maxLength).trim();
}

function calculateDiscount(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= 0) return discountedPrice === 0 ? 100 : 0;
  const discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  return Math.max(0, Math.min(100, discount));
}

function calculateQualityScore(
  deal: NormalizedDeal,
  trustLevel: number,
  reviewReasons: string[]
): number {
  let score = 25 + Math.max(0, Math.min(5, trustLevel)) * 12;

  if (deal.discountPercentage >= 20) score += 10;
  if (deal.discountPercentage >= 50) score += 10;
  if (deal.imageUrl) score += 8;
  if (deal.couponCode) score += 4;
  if (deal.expiryDate) score += 5;
  if (deal.affiliateLink) score += 5;
  score -= reviewReasons.length * 15;

  return Math.max(0, Math.min(100, score));
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function money(value: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100) / 100;
}

function normalizeForKey(value: string): string {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function buildComparisonKey(title: string): string {
  return cleanText(title)
    .toLowerCase()
    .replace(/\b(offer|deal|discount|sale|with|and|the|for|new|latest)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token.length > 2)
    .slice(0, 8)
    .join("-");
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
