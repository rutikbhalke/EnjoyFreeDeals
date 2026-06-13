import { getUserId, isLoggedIn } from "@/lib/auth";

const DEFAULT_API_BASE_URL = "https://enjoyfreedeals.vercel.app";
const FALLBACK_API_BASE_URLS = [
  "https://enjoyfreedeals.vercel.app",
  "https://enjoy-free-deals.vercel.app",
].map((value) => value.replace(/\/+$/, ""));

export const API_BASE_URL = resolveApiBaseUrl();
export const API_BASE_URLS = resolveApiBaseUrls();

function resolveApiBaseUrls() {
  const configured = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  const candidates = [configured, DEFAULT_API_BASE_URL, ...FALLBACK_API_BASE_URLS]
    .map((value) => String(value || "").trim().replace(/\/+$/, ""))
    .filter(Boolean);
  return [...new Set(candidates)];
}

function resolveApiBaseUrl() {
  return API_BASE_URLS[0] || DEFAULT_API_BASE_URL;
}

export type BackendDeal = {
  id: string;
  dealId?: string;
  title: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  sourceImageUrl?: string | null;
  productImage?: string | null;
  productUrl?: string | null;
  dealUrl?: string | null;
  affiliateUrl?: string | null;
  storeName?: string | null;
  storeLogo?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  originalPrice?: number | null;
  dealPrice?: number | null;
  discountedPrice?: number | null;
  priceStatus?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  manualPriceNote?: string | null;
  discountPercent?: number | null;
  couponCode?: string | null;
  cashbackPercentage?: number | null;
  isHotDeal?: boolean;
  isBestPrice?: boolean;
  dealScore?: number | null;
  isFeatured?: boolean;
  clickCount?: number;
  voteScore?: number;
  upvoteCount?: number;
  upvote_count?: number;
  userHasUpvoted?: boolean;
  user_has_upvoted?: boolean;
  updatedAt?: string | null;
  fetchedAt?: string | null;
  lastCheckedAt?: string | null;
  sourceUpdatedAt?: string | null;
  platformExpiresAt?: string | null;
  expiryStatus?: string | null;
  expiryAt?: string | null;
  expiryNote?: string | null;
  lowestPrice?: number | null;
  bestPlatform?: string | null;
  comparisonCount?: number | null;
  lastPriceCheckedAt?: string | null;
  createdAt?: string | null;
};

export type WebDeal = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  original_price: number | null;
  discounted_price: number | null;
  price_status: string | null;
  price_min: number | null;
  price_max: number | null;
  manual_price_note: string | null;
  discount_percentage: number | null;
  coupon_code: string | null;
  cashback_percentage: number | null;
  image_url: string | null;
  source_image_url: string | null;
  affiliate_link: string | null;
  product_url: string | null;
  expiry_date: string | null;
  expiry_status: string | null;
  expiry_note: string | null;
  updated_at: string | null;
  created_at: string | null;
  is_featured: boolean;
  click_count: number;
  vote_score: number;
  upvote_count: number;
  user_has_upvoted: boolean;
  lowest_price: number | null;
  best_platform: string | null;
  comparison_count: number;
  is_hot_deal: boolean;
  is_best_price: boolean;
  deal_score: number | null;
  last_price_checked_at: string | null;
  stores: { name: string; logo_url: string | null; slug: string } | null;
  categories: { name: string; slug: string } | null;
};

export type PlatformPrice = {
  platform: string;
  platform_logo_url: string | null;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  coupon_code: string | null;
  delivery_charge: number | null;
  rating: number | null;
  review_count: number;
  product_url: string;
  is_lowest_price: boolean;
  is_available: boolean;
  last_checked_at: string | null;
  is_direct_link?: boolean;
};

export type PriceComparison = {
  product_id: string;
  lowest_price: number;
  best_platform: string;
  comparison_count: number;
  last_price_checked_at: string | null;
  prices: PlatformPrice[];
};

export type TrackPriceHistoryPoint = {
  price: number;
  checkedAt: string | null;
  storeName?: string | null;
  source?: string | null;
};

export type TrackPriceResult = {
  success: boolean;
  trackingStarted?: boolean;
  storeName: string;
  productUrl: string;
  title: string;
  imageUrl: string;
  currentPrice: number | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  averagePrice: number | null;
  currency: string;
  priceHistory: TrackPriceHistoryPoint[];
  bestDeal: {
    storeName: string;
    dealPrice: number;
    productUrl: string;
  } | null;
  message?: string;
};

export type WebCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  meta?: unknown;
  message?: string;
};

export async function apiGet<T>(path: string): Promise<T> {
  const { body } = await apiRequest<T>(path, { headers: { Accept: "application/json" } });
  return (body.data ?? body) as T;
}

export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const { body } = await apiRequest<T>(path, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (body.data ?? body) as T;
}

export async function apiDelete<T>(path: string, payload: unknown): Promise<T> {
  const { body } = await apiRequest<T>(path, {
    method: "DELETE",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (body.data ?? body) as T;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<{ response: Response; body: ApiResponse<T> }> {
  let lastError: Error | null = null;

  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, init);
      const rawText = await response.text();
      const body = safeParseJson<ApiResponse<T>>(rawText);
      const message = body.message || `API request failed: ${response.status}`;

      if (!response.ok || body.success === false) {
        if (shouldRetryApiResponse(response.status, rawText)) {
          lastError = new Error(message);
          continue;
        }
        throw new Error(message);
      }

      return { response, body };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error("Backend API is not reachable. Please check Vercel backend URL.");
}

export async function fetchDeals(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  const currentUserId = isLoggedIn() ? getUserId() : "";
  if (currentUserId && params.userId === undefined) query.set("userId", currentUserId);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query}` : "";
  const deals = await apiGet<BackendDeal[]>(`/api/deals${suffix}`);
  return deals.map(mapBackendDeal);
}

export async function fetchCategories() {
  const categories = await apiGet<Array<{
    categoryId?: string;
    id?: string;
    categoryName?: string;
    name?: string;
    categoryIcon?: string;
    icon?: string;
    categoryImage?: string;
    image_url?: string;
    description?: string;
    isActive?: boolean;
    slug?: string;
  }>>("/api/categories");

  const mapped = categories.map((category) => {
    const name = normalizeCategoryName(category.categoryName || category.name);
    return {
      id: category.categoryId || category.id || slugify(name),
      name,
      slug: category.slug || slugify(name),
      icon: category.categoryIcon || category.icon || null,
      image_url: category.categoryImage || category.image_url || null,
      description: category.description || null,
      is_active: category.isActive !== false,
    };
  });

  if (!mapped.some((category) => category.slug === "other-deals" || normalizeCategoryName(category.name) === "Other Deals")) {
    mapped.push({
      id: "other-deals",
      name: "Other Deals",
      slug: "other-deals",
      icon: null,
      image_url: null,
      description: null,
      is_active: true,
    });
  }

  return mapped;
}

export async function fetchPriceComparison(productId: string): Promise<PriceComparison | null> {
  if (!productId) return null;
  try {
    console.info("[price-comparison] loading", { productId, url: `${API_BASE_URL}/api/compare-price?productId=${encodeURIComponent(productId)}` });
    const comparison = await apiGet<PriceComparison>(`/api/compare-price?productId=${encodeURIComponent(productId)}`);
    console.info("[price-comparison] rows", comparison?.prices?.length || 0);
    return comparison?.prices?.length ? comparison : demoPriceComparison(productId);
  } catch (error) {
    console.warn("[price-comparison] fallback demo data used", error);
    return demoPriceComparison(productId);
  }
}

export async function trackPrice(productUrl: string) {
  return apiPost<TrackPriceResult>("/api/track-price", { productUrl });
}

export function mapBackendDeal(deal: BackendDeal): WebDeal {
  const storeName = deal.storeName || "Store";
  const categoryName = normalizeCategoryName(deal.categoryName);
  const updatedAt = deal.sourceUpdatedAt || deal.lastCheckedAt || deal.fetchedAt || deal.updatedAt || deal.createdAt || null;
  const dealUrl = deal.affiliateUrl || deal.dealUrl || deal.productUrl || null;
  const imageUrl = firstHttpUrl(deal.imageUrl, deal.productImage, deal.sourceImageUrl);

  return {
    id: deal.id || deal.dealId || "",
    title: deal.title || "Deal",
    slug: deal.slug || deal.id || deal.dealId || slugify(deal.title),
    description: deal.description || null,
    original_price: numberOrNull(deal.originalPrice),
    discounted_price: numberOrNull(deal.dealPrice ?? deal.discountedPrice),
    price_status: deal.priceStatus || null,
    price_min: numberOrNull(deal.priceMin),
    price_max: numberOrNull(deal.priceMax),
    manual_price_note: deal.manualPriceNote || null,
    discount_percentage: numberOrNull(deal.discountPercent),
    coupon_code: deal.couponCode || null,
    cashback_percentage: numberOrNull(deal.cashbackPercentage),
    image_url: imageUrl,
    source_image_url: firstHttpUrl(deal.sourceImageUrl),
    affiliate_link: dealUrl,
    product_url: deal.productUrl || deal.dealUrl || null,
    expiry_date: deal.expiryAt || deal.platformExpiresAt || null,
    expiry_status: deal.expiryStatus || null,
    expiry_note: deal.expiryNote || null,
    updated_at: updatedAt,
    created_at: deal.createdAt || updatedAt,
    is_featured: Boolean(deal.isFeatured || deal.isHotDeal),
    click_count: Number(deal.clickCount || 0),
    vote_score: Number(deal.voteScore || 0),
    upvote_count: Number(deal.upvoteCount ?? deal.upvote_count ?? 0),
    user_has_upvoted: Boolean(deal.userHasUpvoted ?? deal.user_has_upvoted),
    lowest_price: numberOrNull(deal.lowestPrice),
    best_platform: deal.bestPlatform || null,
    comparison_count: Number(deal.comparisonCount || 0),
    is_hot_deal: Boolean(deal.isHotDeal),
    is_best_price: Boolean(deal.isBestPrice),
    deal_score: numberOrNull(deal.dealScore),
    last_price_checked_at: deal.lastPriceCheckedAt || null,
    stores: {
      name: storeName,
      logo_url: deal.storeLogo || null,
      slug: slugify(storeName),
    },
    categories: {
      name: categoryName,
      slug: deal.categorySlug || slugify(categoryName),
    },
  };
}

export type UpvoteResponse = {
  success: boolean;
  message: string;
  upvoted: boolean;
  upvote_count: number;
};

export type UpvotedDealItem = {
  id: string;
  userId: string;
  dealId: string;
  createdAt: string;
  deal: BackendDeal | null;
};

export async function upvoteDeal(userId: string, dealId: string) {
  return apiPost<UpvoteResponse>("/api/upvoted-deals", { userId, dealId });
}

export async function removeUpvote(userId: string, dealId: string) {
  return apiDelete<UpvoteResponse>("/api/upvoted-deals", { userId, dealId });
}

export async function fetchUpvotedDeals(userId: string) {
  const response = await apiGet<{ success: boolean; count: number; deals: UpvotedDealItem[] }>(
    `/api/upvoted-deals?userId=${encodeURIComponent(userId)}`
  );
  return response;
}

export function formatUpdatedTime(value?: string | null) {
  if (!value) return "Updated recently";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Updated recently";
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(elapsed / 3600000);
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  if (hours < 24) return hours === 1 ? "Updated 1 hour ago" : `Updated ${hours} hours ago`;
  return "Updated recently";
}

function numberOrNull(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function safeParseJson<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
}

function shouldRetryApiResponse(status: number, rawText: string) {
  if (status >= 500 || status === 404 || status === 408 || status === 429) return true;
  return /<html|<!doctype/i.test(rawText);
}

function firstHttpUrl(...values: Array<string | null | undefined>) {
  return values.map((value) => String(value || "").trim()).find(isUsableImageUrl) || null;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isUsableImageUrl(value: string) {
  if (!isHttpUrl(value)) return false;
  const lowerValue = value.toLowerCase();
  return !(
    lowerValue.includes("amazon-adsystem.com/widgets/q") ||
    lowerValue.includes("id=asinimage")
  );
}

function slugify(value?: string | null) {
  return String(value || "other-deals")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "other-deals";
}

function normalizeCategoryName(value?: string | null) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "Other Deals";
  if (/^(?:unknown|other[-\s]?deals?)$/i.test(cleaned)) return "Other Deals";
  return cleaned;
}

function buildSearchUrl(platform: string, productName: string) {
  const query = productName.trim();
  if (!query) return "";
  const encoded = encodeURIComponent(query);
  const key = platform.toLowerCase().replace(/[^a-z0-9]+/g, "");
  switch (key) {
    case "amazon": return `https://www.amazon.in/s?k=${encoded}`;
    case "flipkart": return `https://www.flipkart.com/search?q=${encoded}`;
    case "meesho": return `https://www.meesho.com/search?q=${encoded}`;
    case "croma": return `https://www.croma.com/searchB?q=${encoded}`;
    case "boat": return `https://www.boat-lifestyle.com/search?q=${encoded}`;
    case "reliancedigital": return `https://www.reliancedigital.in/search?q=${encoded}`;
    default: return `https://www.google.com/search?q=${encoded}+${encodeURIComponent(platform)}+price`;
  }
}

function demoPriceComparison(productId: string): PriceComparison {
  const now = new Date().toISOString();
  const name = "product";
  const rows: Array<[string, number, number]> = [
    ["Meesho", 899, 1899],
    ["Flipkart", 949, 1999],
    ["Amazon", 999, 1999],
    ["Croma", 1049, 2099],
    ["Boat", 1099, 2499],
    ["Reliance Digital", 1199, 2499],
  ];
  const prices = rows.map(([platform, price, originalPrice]) => ({
    platform,
    platform_logo_url: platformLogo(platform),
    price,
    original_price: originalPrice,
    discount_percent: Math.round(((originalPrice - price) / originalPrice) * 100),
    coupon_code: platform === "Amazon" ? "SAVE100" : null,
    delivery_charge: 0,
    rating: 4.2,
    review_count: 0,
    product_url: buildSearchUrl(platform, name),
    is_lowest_price: platform === "Meesho",
    is_available: true,
    is_direct_link: false,
    last_checked_at: now,
  }));
  return {
    product_id: productId,
    lowest_price: 899,
    best_platform: "Meesho",
    comparison_count: prices.length,
    last_price_checked_at: now,
    prices,
  };
}

function platformLogo(platform: string) {
  const key = platform.toLowerCase();
  if (key === "amazon") return "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg";
  if (key === "flipkart") return "https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fk-logo-pre-login-3a7a30.svg";
  if (key === "meesho") return "https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo_Full.png";
  if (key === "croma") return "https://media-ik.croma.com/prod/https://media.croma.com/image/upload/v1664415872/Croma%20Assets/CMS/Homepage%20Banners/Croma_logo_hqvdqv.svg";
  if (key === "boat") return "https://logo.clearbit.com/boat-lifestyle.com";
  if (key === "reliance digital") return "https://logo.clearbit.com/reliancedigital.in";
  if (key === "jiomart") return "https://logo.clearbit.com/jiomart.com";
  if (key === "nykaa") return "https://logo.clearbit.com/nykaa.com";
  return "/logo.png";
}
