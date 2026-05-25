import type { DealSourceRow, JsonObject, SourceDeal } from "./types.ts";

type SourceTemplate = Omit<SourceDeal, "raw">;

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DISCOVERY_LIMIT = 12;
const DEFAULT_FETCH_TIMEOUT_MS = 12000;

export async function fetchSourceDeals(source: DealSourceRow): Promise<SourceDeal[]> {
  if (Deno.env.get("IMPORT_DEALS_ENABLE_MOCKS") === "true") {
    return buildMockDeals(source, "mock-enabled");
  }

  const sourceType = String(source.source_type || "").toLowerCase();
  if (sourceType === "api") {
    return [];
  }

  return fetchScrapedDeals(source);
}

async function fetchScrapedDeals(source: DealSourceRow): Promise<SourceDeal[]> {
  const seedUrls = getSeedUrls(source);
  const discoveredUrls = new Set<string>();

  for (const url of seedUrls) {
    const page = await fetchHtml(url);
    for (const productUrl of discoverProductUrls(page.html, page.finalUrl, source)) {
      discoveredUrls.add(productUrl);
      if (discoveredUrls.size >= discoveryLimit()) break;
    }
    if (discoveredUrls.size >= discoveryLimit()) break;
  }

  const candidateUrls = discoveredUrls.size > 0 ? [...discoveredUrls] : seedUrls;
  const deals: SourceDeal[] = [];

  for (const productUrl of candidateUrls.slice(0, discoveryLimit())) {
    try {
      const page = await fetchHtml(productUrl);
      const deal = extractDealFromHtml(source, page.finalUrl, page.html);
      if (deal) deals.push(deal);
    } catch (error) {
      console.warn("Failed to scrape product URL", productUrl, error);
    }
  }

  return deals;
}

async function fetchHtml(url: string): Promise<{ finalUrl: string; html: string }> {
  try {
    return await fetchHtmlDirect(url);
  } catch (error) {
    const proxyUrl = cleanText(Deno.env.get("SCRAPER_FETCH_PROXY_URL") || "");
    if (!proxyUrl) throw error;
    return fetchHtmlViaProxy(proxyUrl, url, error);
  }
}

async function fetchHtmlDirect(url: string): Promise<{ finalUrl: string; html: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs());

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-IN,en;q=0.9",
        "user-agent": "EnjoyFreeDealsBot/1.0 (+https://enjoyfreedeals.app; deal price indexing)"
      },
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error(`Fetch failed with HTTP ${response.status}`);
    }

    return {
      finalUrl: response.url || url,
      html: await response.text()
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHtmlViaProxy(
  proxyUrl: string,
  targetUrl: string,
  directError: unknown
): Promise<{ finalUrl: string; html: string }> {
  const requestUrl = proxyUrl.includes("{url}")
    ? proxyUrl.replace("{url}", encodeURIComponent(targetUrl))
    : withQueryParam(proxyUrl, "url", targetUrl);
  const token = cleanText(Deno.env.get("SCRAPER_FETCH_PROXY_TOKEN") || "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs() * 2);

  try {
    const response = await fetch(requestUrl, {
      signal: controller.signal,
      headers: {
        "accept": "application/json,text/html,*/*;q=0.8",
        ...(token ? { "authorization": `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Proxy fetch failed with HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await response.json() as JsonObject;
      return {
        finalUrl: String(payload.finalUrl || payload.url || targetUrl),
        html: String(payload.html || payload.body || "")
      };
    }

    return {
      finalUrl: targetUrl,
      html: await response.text()
    };
  } catch (proxyError) {
    const directMessage = directError instanceof Error ? directError.message : "direct fetch failed";
    const proxyMessage = proxyError instanceof Error ? proxyError.message : "proxy fetch failed";
    throw new Error(`${directMessage}; ${proxyMessage}`);
  } finally {
    clearTimeout(timeout);
  }
}

function extractDealFromHtml(source: DealSourceRow, productUrl: string, html: string): SourceDeal | null {
  const productJson = findProductJsonLd(html);
  const offer = firstObject(productJson?.offers);
  const title = cleanText(
    stringValue(productJson?.name) ||
      metaContent(html, "og:title") ||
      metaContent(html, "twitter:title") ||
      titleTag(html)
  );
  const imageUrl = absoluteUrl(
    stringValue(firstValue(productJson?.image)) ||
      metaContent(html, "og:image") ||
      metaContent(html, "twitter:image"),
    productUrl
  );
  const description = cleanText(
    stringValue(productJson?.description) ||
      metaContent(html, "og:description") ||
      metaContent(html, "description") ||
      title
  );
  const discountedPrice = money(
    firstNumber([
      offer?.price,
      metaContent(html, "product:price:amount"),
      metaContent(html, "twitter:data1"),
      priceFromHtml(html)
    ])
  );
  const originalPrice = money(firstNumber([
    metaContent(html, "product:original_price:amount"),
    metaContent(html, "og:price:standard_amount"),
    originalPriceFromHtml(html),
    discountedPrice
  ]));

  if (!title || discountedPrice <= 0) {
    return null;
  }

  const canonicalProductUrl = canonicalProductUrlFromHtml(html, productUrl);
  const sourceProductId = cleanText(
    stringValue(productJson?.sku) ||
      stringValue(productJson?.mpn) ||
      metaContent(html, "product:retailer_item_id") ||
      productIdFromUrl(canonicalProductUrl)
  );

  return {
    sourceProductId,
    sourceUrl: canonicalProductUrl,
    title,
    description,
    categoryName: inferCategory(title, source),
    originalPrice: Math.max(originalPrice, discountedPrice),
    discountedPrice,
    couponCode: couponFromHtml(html),
    imageUrl,
    affiliateUrl: canonicalProductUrl,
    expiryDate: daysFromNow(3),
    raw: {
      connectorMode: "html-scrape",
      sourceKey: source.source_key,
      sourceName: source.source_name,
      capturedAt: new Date().toISOString(),
      finalUrl: productUrl,
      jsonLdFound: Boolean(productJson)
    }
  };
}

function discoverProductUrls(html: string, pageUrl: string, source: DealSourceRow): string[] {
  const urls = new Set<string>();
  const hrefPattern = /href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefPattern.exec(html)) !== null) {
    const url = absoluteUrl(decodeHtml(match[1]), pageUrl);
    if (isLikelyProductUrl(url, source)) urls.add(stripUrlNoise(url));
    if (urls.size >= discoveryLimit()) break;
  }

  return [...urls];
}

function isLikelyProductUrl(url: string, source: DealSourceRow): boolean {
  try {
    const parsed = new URL(url);
    const baseHost = new URL(source.base_url).hostname.replace(/^www\./, "");
    const host = parsed.hostname.replace(/^www\./, "");
    if (!host.endsWith(baseHost)) return false;

    const path = parsed.pathname.toLowerCase();
    const sourceKey = source.source_key.toLowerCase();
    if (sourceKey === "amazon") return /\/dp\/|\/gp\/product\//.test(path);
    if (sourceKey === "flipkart") return /\/p\/itm|pid=/.test(path + parsed.search.toLowerCase());
    if (sourceKey === "myntra") return /\/buy$|\/\d+\/buy$/.test(path);
    if (sourceKey === "ajio") return /\/p\//.test(path);
    if (sourceKey === "croma") return /\/p\/\d+/.test(path);
    if (sourceKey === "tatacliq") return /\/p-mp/.test(path);
    return /\/p\/|\/product\/|\/dp\/|pid=/.test(path + parsed.search.toLowerCase());
  } catch {
    return false;
  }
}

function getSeedUrls(source: DealSourceRow): string[] {
  const envName = `SCRAPER_SEED_URLS_${source.source_key.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const configured = Deno.env.get(envName) || "";
  const urls = configured
    .split(",")
    .map((value) => cleanText(value))
    .filter(Boolean);

  return (urls.length > 0 ? urls : [source.base_url]).map((url) => absoluteUrl(url, source.base_url));
}

function findProductJsonLd(html: string): JsonObject | null {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];

  for (const script of scripts) {
    const body = decodeHtml(script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim());
    try {
      const parsed = JSON.parse(body) as unknown;
      const product = findProductObject(parsed);
      if (product) return product;
    } catch {
      continue;
    }
  }

  return null;
}

function findProductObject(value: unknown): JsonObject | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const product = findProductObject(item);
      if (product) return product;
    }
    return null;
  }

  if (!isObject(value)) return null;

  const type = firstValue(value["@type"]);
  if (typeof type === "string" && type.toLowerCase() === "product") {
    return value;
  }

  const graph = value["@graph"];
  if (Array.isArray(graph)) return findProductObject(graph);
  return null;
}

function metaContent(html: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return "";
}

function titleTag(html: string): string {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
}

function canonicalProductUrlFromHtml(html: string, fallbackUrl: string): string {
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
  return stripUrlNoise(absoluteUrl(decodeHtml(canonical) || fallbackUrl, fallbackUrl));
}

function couponFromHtml(html: string): string {
  const match = cleanText(html).match(/\b[A-Z0-9]{4,16}\b(?=\s*(coupon|code|promo))/i);
  return match?.[0]?.toUpperCase() || "";
}

function priceFromHtml(html: string): number {
  const text = cleanText(html.replace(/<script[\s\S]*?<\/script>/gi, " "));
  const match = text.match(/(?:₹|Rs\.?|INR)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

function originalPriceFromHtml(html: string): number {
  const text = cleanText(html.replace(/<script[\s\S]*?<\/script>/gi, " "));
  const match = text.match(/(?:MRP|List Price|Original Price)[^₹\d]{0,40}(?:₹|Rs\.?|INR)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

function inferCategory(title: string, source: DealSourceRow): string {
  const value = `${title} ${source.source_name}`.toLowerCase();
  if (/phone|mobile|earbud|speaker|laptop|watch|camera|charger|tablet/.test(value)) return "Electronics";
  if (/shirt|shoe|jeans|dress|fashion|bag|backpack/.test(value)) return "Fashion";
  if (/book|course|student|exam/.test(value)) return "Student Deals";
  if (/food|grocery|kitchen/.test(value)) return "Grocery";
  return "General";
}

function productIdFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const dpIndex = pathParts.findIndex((part) => part.toLowerCase() === "dp");
    if (dpIndex >= 0 && pathParts[dpIndex + 1]) return pathParts[dpIndex + 1];
    return parsed.searchParams.get("pid") || pathParts.at(-1) || url;
  } catch {
    return url;
  }
}

function stripUrlNoise(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const param of [...parsed.searchParams.keys()]) {
      if (/^(utm_|affid|tag|ref|fbclid|gclid)/i.test(param)) parsed.searchParams.delete(param);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function absoluteUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function withQueryParam(url: string, name: string, value: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set(name, value);
    return parsed.toString();
  } catch {
    return url;
  }
}

function firstObject(value: unknown): JsonObject | null {
  const item = firstValue(value);
  return isObject(item) ? item : null;
}

function firstValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function firstNumber(values: unknown[]): number {
  for (const value of values) {
    const numeric = money(value);
    if (numeric > 0) return numeric;
  }
  return 0;
}

function stringValue(value: unknown): string {
  const item = firstValue(value);
  return typeof item === "string" || typeof item === "number" ? String(item) : "";
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: string): string {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string): string {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function money(value: unknown): number {
  const numeric = Number(String(value || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100) / 100;
}

function discoveryLimit(): number {
  const value = Number(Deno.env.get("IMPORT_DEALS_DISCOVERY_LIMIT"));
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_DISCOVERY_LIMIT;
}

function fetchTimeoutMs(): number {
  const value = Number(Deno.env.get("IMPORT_DEALS_FETCH_TIMEOUT_MS"));
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_FETCH_TIMEOUT_MS;
}

function buildMockDeals(source: DealSourceRow, connectorMode: string): SourceDeal[] {
  const templates = mockCatalog[source.source_key] || buildGenericTemplate(source);
  return templates.map((deal) => ({
    ...deal,
    sourceUrl: absoluteUrl(deal.sourceUrl, source.base_url),
    affiliateUrl: absoluteUrl(deal.sourceUrl, source.base_url),
    raw: {
      connectorMode,
      sourceKey: source.source_key,
      sourceName: source.source_name,
      capturedAt: new Date().toISOString()
    }
  }));
}

function buildGenericTemplate(source: DealSourceRow): SourceTemplate[] {
  return [
    {
      sourceProductId: `${source.source_key}-sample-1`,
      sourceUrl: source.base_url,
      title: `${source.source_name} Sample Deal`,
      description: `Placeholder API response for ${source.source_name}.`,
      categoryName: "General",
      originalPrice: 999,
      discountedPrice: 699,
      couponCode: "",
      imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80",
      affiliateUrl: source.base_url,
      expiryDate: daysFromNow(3)
    }
  ];
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

const mockCatalog: Record<string, SourceTemplate[]> = {
  amazon: [
    {
      sourceProductId: "B0CBOAT60",
      sourceUrl: "/dp/B0CBOAT60",
      title: "boAt Airdopes Bluetooth Earbuds",
      description: "Deep bass wireless earbuds with fast charging case.",
      categoryName: "Electronics",
      originalPrice: 3999,
      discountedPrice: 1599,
      couponCode: "BOAT60",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80",
      affiliateUrl: "/dp/B0CBOAT60",
      expiryDate: daysFromNow(2)
    }
  ]
};
