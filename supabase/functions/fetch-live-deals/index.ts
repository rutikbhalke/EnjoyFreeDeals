import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Availability = "in_stock" | "out_of_stock" | "limited_stock";

type PlatformDealPayload = Partial<NormalizedDeal> & { [key: string]: unknown };
type SupabaseClient = ReturnType<typeof createClient>;

const FALLBACK_DEAL_IMAGES: Record<string, string> = {
  electronics: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80",
  mobile: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  fashion: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
  shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  home: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=900&q=80",
  grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
  general: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80",
};

const PLATFORM_STORES: Record<string, { name: string; websiteUrl: string }> = {
  amazon: { name: "Amazon", websiteUrl: "https://www.amazon.in" },
  flipkart: { name: "Flipkart", websiteUrl: "https://www.flipkart.com" },
  meesho: { name: "Meesho", websiteUrl: "https://www.meesho.com" },
  myntra: { name: "Myntra", websiteUrl: "https://www.myntra.com" },
  ajio: { name: "Ajio", websiteUrl: "https://www.ajio.com" },
  tatacliq: { name: "TataCliq", websiteUrl: "https://www.tatacliq.com" },
  croma: { name: "Croma", websiteUrl: "https://www.croma.com" },
  nykaa: { name: "Nykaa", websiteUrl: "https://www.nykaa.com" },
  snapdeal: { name: "Snapdeal", websiteUrl: "https://www.snapdeal.com" },
};

interface NormalizedDeal {
  provider: string;
  externalProductId: string;
  title: string;
  productUrl: string;
  affiliateUrl: string;
  imageUrl: string;
  originalPrice: number;
  currentPrice: number;
  couponCode?: string;
  deliveryInfo?: string;
  availability: Availability;
  rating?: number;
  ratingCount?: number;
  reviewCount?: number;
  category: string;
  brand?: string;
  model?: string;
  expiresAt?: string;
}

interface DealProvider {
  readonly name: string;
  fetchDeals(): Promise<NormalizedDeal[]>;
}

abstract class ApiProvider implements DealProvider {
  constructor(
    readonly name: string,
    protected readonly apiKey: string | undefined,
  ) {}

  async fetchDeals(): Promise<NormalizedDeal[]> {
    if (!this.apiKey) return [];
    const deals = await this.fetchFromOfficialFeed();
    return deals.map((deal) => ({
      ...deal,
      provider: deal.provider || this.name,
      imageUrl: resolveDealImage(deal as PlatformDealPayload, this.name),
    }));
  }

  protected async fetchFromOfficialFeed(): Promise<NormalizedDeal[]> {
    return [];
  }
}

class AmazonProvider extends ApiProvider {
  constructor() {
    super("amazon", Deno.env.get("AMAZON_API_KEY"));
  }
}

class FlipkartProvider extends ApiProvider {
  constructor() {
    super("flipkart", Deno.env.get("FLIPKART_API_KEY"));
  }
}

class MeeshoProvider extends ApiProvider {
  constructor() {
    super("meesho", Deno.env.get("MEESHO_API_KEY"));
  }
}

class MyntraProvider extends ApiProvider {
  constructor() {
    super("myntra", Deno.env.get("MYNTRA_API_KEY"));
  }
}

class AjioProvider extends ApiProvider {
  constructor() {
    super("ajio", Deno.env.get("AJIO_API_KEY"));
  }
}

class TataCliqProvider extends ApiProvider {
  constructor() {
    super("tatacliq", Deno.env.get("TATACLIQ_API_KEY"));
  }
}

class CromaProvider extends ApiProvider {
  constructor() {
    super("croma", Deno.env.get("CROMA_API_KEY"));
  }
}

class NykaaProvider extends ApiProvider {
  constructor() {
    super("nykaa", Deno.env.get("NYKAA_API_KEY"));
  }
}

class SnapdealProvider extends ApiProvider {
  constructor() {
    super("snapdeal", Deno.env.get("SNAPDEAL_API_KEY"));
  }
}

const providers: DealProvider[] = [
  new AmazonProvider(),
  new FlipkartProvider(),
  new MeeshoProvider(),
  new MyntraProvider(),
  new AjioProvider(),
  new TataCliqProvider(),
  new CromaProvider(),
  new NykaaProvider(),
  new SnapdealProvider(),
];

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase function environment is not configured." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const runStartedAt = new Date().toISOString();
  let fetchedCount = 0;
  let upsertedCount = 0;
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const deals = await provider.fetchDeals();
      fetchedCount += deals.length;
      const storeId = deals.length > 0 ? await ensureStore(supabase, provider.name) : null;

      for (const deal of deals) {
        const imageUrl = resolveDealImage(deal as PlatformDealPayload, provider.name);
        const productGroupKey = normalizeGroupKey(deal);
        const productPayload = {
          external_product_id: deal.externalProductId,
          product_group_key: productGroupKey,
          title: deal.title,
          description: deal.title,
          image_url: imageUrl,
          brand: deal.brand ?? null,
          model: deal.model ?? null,
          category_slug: slugify(deal.category, "general"),
          category_name: deal.category,
          updated_at: new Date().toISOString(),
        };

        const { data: product, error: productError } = await supabase
          .from("products")
          .upsert(productPayload, { onConflict: "external_product_id" })
          .select("id")
          .single();

        if (productError) throw productError;

        const discountPercent = calculateDiscountPercent(deal.originalPrice, deal.currentPrice);
        const offerPayload = {
          product_id: product.id,
          store_slug: provider.name,
          product_url: deal.productUrl,
          affiliate_url: deal.affiliateUrl || deal.productUrl,
          image_url: imageUrl,
          original_price: deal.originalPrice,
          current_price: deal.currentPrice,
          discount_percent: discountPercent,
          coupon_code: deal.couponCode ?? null,
          delivery_info: deal.deliveryInfo ?? null,
          availability: deal.availability,
          status: shouldExpire(deal) ? "expired" : "active",
          rating: deal.rating ?? null,
          rating_count: deal.ratingCount ?? 0,
          review_count: deal.reviewCount ?? 0,
          is_hot_deal: discountPercent >= 50,
          expires_at: deal.expiresAt ?? null,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: offerError } = await supabase
          .from("product_offers")
          .upsert(offerPayload, { onConflict: "product_id,store_slug" });

        if (offerError) throw offerError;
        await upsertDealDatabaseRow(supabase, {
          providerName: provider.name,
          deal,
          imageUrl,
          discountPercent,
          storeId,
          categoryId: await ensureCategory(supabase, deal.category),
        });
        upsertedCount += 1;
      }

      await supabase
        .from("stores")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("slug", provider.name);
    } catch (error) {
      errors.push(`${provider.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await supabase.rpc("cleanup_expired_deals");

  await supabase.from("fetch_runs").insert({
    started_at: runStartedAt,
    finished_at: new Date().toISOString(),
    fetched_count: fetchedCount,
    upserted_count: upsertedCount,
    error_count: errors.length,
    errors,
  });

  return json({
    fetchedCount,
    upsertedCount,
    errors,
  });
});

function calculateDiscountPercent(originalPrice: number, currentPrice: number): number {
  if (originalPrice <= 0 || currentPrice < 0 || currentPrice > originalPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

function shouldExpire(deal: NormalizedDeal): boolean {
  if (deal.availability === "out_of_stock") return true;
  if (!deal.expiresAt) return false;
  return new Date(deal.expiresAt).getTime() <= Date.now();
}

function normalizeGroupKey(deal: NormalizedDeal): string {
  return slugify([deal.brand, deal.model, deal.title].filter(Boolean).join(" "), "product");
}

async function ensureStore(supabase: SupabaseClient, providerName: string): Promise<string | null> {
  const store = PLATFORM_STORES[providerName] || {
    name: toTitleCase(providerName),
    websiteUrl: "",
  };
  const host = safeHost(store.websiteUrl);
  const { data, error } = await supabase
    .from("stores")
    .upsert({
      name: store.name,
      slug: providerName,
      website_url: store.websiteUrl,
      logo_url: host ? `https://www.google.com/s2/favicons?domain=${host}&sz=128` : "",
      is_active: true,
    }, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) throw error;
  return data?.id || null;
}

async function ensureCategory(supabase: SupabaseClient, category: string): Promise<string | null> {
  const categoryName = cleanText(category) || "General";
  const { data, error } = await supabase
    .from("categories")
    .upsert({
      name: categoryName,
      slug: slugify(categoryName, "general"),
      is_active: true,
    }, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) throw error;
  return data?.id || null;
}

async function upsertDealDatabaseRow(
  supabase: SupabaseClient,
  options: {
    providerName: string;
    deal: NormalizedDeal;
    imageUrl: string;
    discountPercent: number;
    storeId: string | null;
    categoryId: string | null;
  },
): Promise<void> {
  const { providerName, deal, imageUrl, discountPercent, storeId, categoryId } = options;
  const now = new Date().toISOString();
  const categoryName = cleanText(deal.category) || "General";
  const sourceProductId = cleanText(deal.externalProductId) || `${providerName}:${slugify(deal.title, "deal")}`;
  const productUrl = cleanText(deal.productUrl);
  const affiliateLink = cleanText(deal.affiliateUrl) || productUrl;
  const slug = slugify(`${providerName}-${sourceProductId}`, `${providerName}-deal`);
  const dealType = deal.currentPrice === 0 ? "FREE_DEAL" : deal.couponCode ? "COUPON" : "DISCOUNT";

  const { error } = await supabase
    .from("deals")
    .upsert({
      title: deal.title,
      slug,
      description: deal.title,
      store_id: storeId,
      category_id: categoryId,
      original_price: deal.originalPrice,
      discounted_price: deal.currentPrice,
      discount_percentage: discountPercent,
      coupon_code: deal.couponCode ?? "",
      cashback_percentage: 0,
      affiliate_link: affiliateLink,
      image_url: imageUrl,
      expiry_date: deal.expiresAt ?? null,
      status: shouldExpire(deal) ? "expired" : "active",
      is_featured: discountPercent >= 50 || deal.currentPrice === 0,
      is_verified: true,
      updated_at: now,
      source: dealType,
      source_product_id: sourceProductId,
      source_url: productUrl || affiliateLink,
      dedupe_key: `direct-platform:${providerName}:${sourceProductId}`,
      last_scraped_at: now,
      raw_source_payload: {
        connectorMode: "direct-platform-fetch",
        provider: providerName,
        categoryName,
        imageUrl,
        productUrl,
        normalizedAt: now,
      },
    }, { onConflict: "slug" });

  if (error) throw error;
}

function resolveDealImage(deal: PlatformDealPayload, providerName: string): string {
  const candidates = [
    deal.imageUrl,
    deal.image_url,
    deal.productImage,
    deal.product_image,
    deal.photo,
    deal.photoUrl,
    deal.photo_url,
    deal.thumbnail,
    deal.thumbnailUrl,
    deal.thumbnail_url,
    deal.picture,
    deal.pictureUrl,
    deal.picture_url,
    firstImageValue(deal.images),
    firstImageValue(deal.pictures),
    firstImageValue(deal.media),
  ];

  return candidates
    .map((value) => String(value || "").trim())
    .find(isHttpUrl) || fallbackDealImage(deal, providerName);
}

function firstImageValue(value: unknown): string {
  if (Array.isArray(value)) {
    const image = value
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (isObject(item)) {
          return String(
            item.url ||
              item.src ||
              item.imageUrl ||
              item.image_url ||
              item.thumbnailUrl ||
              item.thumbnail_url ||
              "",
          );
        }
        return "";
      })
      .find(Boolean);
    return image || "";
  }

  if (isObject(value)) {
    return String(
      value.url ||
        value.src ||
        value.imageUrl ||
        value.image_url ||
        value.thumbnailUrl ||
        value.thumbnail_url ||
        "",
    );
  }

  return "";
}

function fallbackDealImage(deal: PlatformDealPayload, providerName: string): string {
  const text = [
    deal.title,
    deal.category,
    deal.brand,
    deal.model,
    providerName,
  ].join(" ").toLowerCase();

  if (containsAny(text, ["phone", "mobile", "smartphone"])) return FALLBACK_DEAL_IMAGES.mobile;
  if (containsAny(text, ["shoe", "sneaker", "footwear"])) return FALLBACK_DEAL_IMAGES.shoes;
  if (containsAny(text, ["shirt", "t-shirt", "kurti", "dress", "fashion", "jeans", "saree"])) return FALLBACK_DEAL_IMAGES.fashion;
  if (containsAny(text, ["grocery", "fruit", "food", "snack", "tea", "coffee"])) return FALLBACK_DEAL_IMAGES.grocery;
  if (containsAny(text, ["beauty", "skin", "makeup", "cosmetic"])) return FALLBACK_DEAL_IMAGES.beauty;
  if (containsAny(text, ["kitchen", "home", "storage", "container"])) return FALLBACK_DEAL_IMAGES.home;
  if (containsAny(text, ["laptop", "student", "backpack", "bag"])) return FALLBACK_DEAL_IMAGES.laptop;
  if (containsAny(text, ["earbud", "speaker", "watch", "charger", "camera", "tablet", "headphone"])) return FALLBACK_DEAL_IMAGES.electronics;
  return FALLBACK_DEAL_IMAGES.general;
}

function containsAny(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(token));
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value: string, fallback = "item"): string {
  const slug = value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function toTitleCase(value: string): string {
  return cleanText(value).replace(/\b([a-z])([a-z]*)/gi, (_, first, rest) =>
    `${first.toUpperCase()}${rest.toLowerCase()}`
  );
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
