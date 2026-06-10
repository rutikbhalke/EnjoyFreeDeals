const DEFAULT_API_BASE_URL = "https://enjoy-free-deals.vercel.app";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

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
  discountPercent?: number | null;
  couponCode?: string | null;
  cashbackPercentage?: number | null;
  isHotDeal?: boolean;
  isFeatured?: boolean;
  clickCount?: number;
  voteScore?: number;
  updatedAt?: string | null;
  fetchedAt?: string | null;
  lastCheckedAt?: string | null;
  sourceUpdatedAt?: string | null;
  platformExpiresAt?: string | null;
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
  discount_percentage: number | null;
  coupon_code: string | null;
  cashback_percentage: number | null;
  image_url: string | null;
  source_image_url: string | null;
  affiliate_link: string | null;
  product_url: string | null;
  expiry_date: string | null;
  updated_at: string | null;
  created_at: string | null;
  is_featured: boolean;
  click_count: number;
  vote_score: number;
  lowest_price: number | null;
  best_platform: string | null;
  comparison_count: number;
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
};

export type PriceComparison = {
  product_id: string;
  lowest_price: number;
  best_platform: string;
  comparison_count: number;
  last_price_checked_at: string | null;
  prices: PlatformPrice[];
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  const body = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok || body.success === false) {
    throw new Error(body.message || `API request failed: ${response.status}`);
  }
  return (body.data ?? body) as T;
}

export async function fetchDeals(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
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

  return categories.map((category) => {
    const name = category.categoryName || category.name || "Other Deals";
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
}

export async function fetchPriceComparison(productId: string): Promise<PriceComparison | null> {
  if (!productId) return null;
  try {
    return await apiGet<PriceComparison>(`/api/compare-price?productId=${encodeURIComponent(productId)}`);
  } catch (error) {
    if (error instanceof Error && /No price comparison|404/i.test(error.message)) return null;
    throw error;
  }
}

export function mapBackendDeal(deal: BackendDeal): WebDeal {
  const storeName = deal.storeName || "Store";
  const categoryName = deal.categoryName || "Other Deals";
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
    discount_percentage: numberOrNull(deal.discountPercent),
    coupon_code: deal.couponCode || null,
    cashback_percentage: numberOrNull(deal.cashbackPercentage),
    image_url: imageUrl,
    source_image_url: firstHttpUrl(deal.sourceImageUrl),
    affiliate_link: dealUrl,
    product_url: deal.productUrl || deal.dealUrl || null,
    expiry_date: deal.platformExpiresAt || null,
    updated_at: updatedAt,
    created_at: deal.createdAt || updatedAt,
    is_featured: Boolean(deal.isFeatured || deal.isHotDeal),
    click_count: Number(deal.clickCount || 0),
    vote_score: Number(deal.voteScore || 0),
    lowest_price: numberOrNull(deal.lowestPrice),
    best_platform: deal.bestPlatform || null,
    comparison_count: Number(deal.comparisonCount || 0),
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
