const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const DEFAULT_LIMIT = 250;
const DEFAULT_CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 15000;
const GENIE_LOOT_STORE = {
  host: "t.me",
  name: "Genie Loot Page",
  slug: "genie-loot-page",
  websiteUrl: "https://t.me/s/India_loot_deals"
};

async function enrichGenieLootDetails(options = {}) {
  const limit = Math.min(2000, Math.max(1, Number(options.limit || DEFAULT_LIMIT)));
  const concurrency = Math.min(25, Math.max(1, Number(options.concurrency || DEFAULT_CONCURRENCY)));
  const timeoutMs = Math.min(30000, Math.max(1000, Number(options.timeoutMs || FETCH_TIMEOUT_MS)));
  const deals = await loadGenieLootDeals(limit);
  const results = await runPool(deals, concurrency, (deal) => enrichDeal(deal, { timeoutMs }));

  return {
    requested: deals.length,
    timeoutMs,
    concurrency,
    enriched: results.filter((result) => result.status === "enriched").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    failed: results.filter((result) => result.status === "failed").length,
    results
  };
}

async function loadGenieLootDeals(limit) {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("id,title,description,original_price,discounted_price,coupon_code,affiliate_link,source_url,image_url,source_image_url,platform_product_url,raw_source_payload")
    .eq("raw_source_payload->>connectorMode", "telegram-page")
    .order("created_at", { ascending: false })
    .limit(limit);

  throwIfSupabaseError(error, "deals");
  return data || [];
}

async function enrichDeal(deal, options = {}) {
  const inputUrl = deal.affiliate_link || deal.source_url || "";
  if (!isHttpUrl(inputUrl) || isTelegramUrl(inputUrl)) {
    return { id: deal.id, title: deal.title, status: "skipped", reason: "No external product link." };
  }

  try {
    const page = await fetchProductPage(inputUrl, options);
    const metadata = extractProductMetadata(page.html, page.finalUrl);
    const update = await buildDealUpdate(deal, page, metadata);

    if (Object.keys(update).length <= 1) {
      return { id: deal.id, title: deal.title, status: "skipped", reason: "No stronger product metadata found." };
    }

    const { error } = await supabaseAdmin
      .from("deals")
      .update(update)
      .eq("id", deal.id);

    throwIfSupabaseError(error, "deals");

    return {
      id: deal.id,
      title: update.title || deal.title,
      status: "enriched",
      finalUrl: update.raw_source_payload?.resolvedProductUrl || page.finalUrl,
      imageUpdated: Boolean(update.image_url),
      priceUpdated: Object.prototype.hasOwnProperty.call(update, "discounted_price")
    };
  } catch (error) {
    return {
      id: deal.id,
      title: deal.title,
      status: "failed",
      reason: error instanceof Error ? error.message : "Unknown enrichment error."
    };
  }
}

async function fetchProductPage(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || FETCH_TIMEOUT_MS);
  let currentUrl = normalizeStoredUrl(url);

  try {
    let response = null;
    let html = "";
    const visitedUrls = new Set();

    for (let redirectCount = 0; redirectCount < 8; redirectCount += 1) {
      currentUrl = normalizeAffiliateRedirectUrl(currentUrl);
      if (visitedUrls.has(currentUrl)) break;
      visitedUrls.add(currentUrl);

      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en-IN,en;q=0.9",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
        }
      });

      const location = response.headers.get("location");
      if (location && response.status >= 300 && response.status < 400) {
        currentUrl = normalizeAffiliateRedirectUrl(absoluteUrl(decodeHtml(location), currentUrl));
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      html = contentType.includes("text/html") || contentType.includes("application/xhtml")
        ? await response.text()
        : "";

      const metaRefreshUrl = metaRefreshTarget(html, currentUrl);
      if (metaRefreshUrl && metaRefreshUrl !== currentUrl) {
        currentUrl = normalizeAffiliateRedirectUrl(metaRefreshUrl);
        continue;
      }

      break;
    }

    if (!response) throw new Error("Product page fetch did not return a response.");

    return {
      finalUrl: normalizeStoredUrl(normalizeAffiliateRedirectUrl(response.url || currentUrl)),
      status: response.status,
      html
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function buildDealUpdate(deal, page, metadata) {
  const existingPayload = isObject(deal.raw_source_payload) ? deal.raw_source_payload : {};
  const finalUrl = bestProductUrl(deal, page, metadata);
  const originalText = existingPayload.originalText || deal.description || deal.title || "";
  const currentPrice = money(deal.discounted_price);
  const currentOriginal = money(deal.original_price);
  const telegramPricing = telegramPricingFromText(originalText);
  const usePlatformPrice = metadata.priceReliable && metadata.discountedPrice > 0;
  const discountedPrice = usePlatformPrice
    ? metadata.discountedPrice
    : telegramPricing.hasDiscountedPrice
    ? telegramPricing.discountedPrice
    : currentPrice || metadata.discountedPrice;
  const mrp = chooseMrp({
    currentOriginal,
    discountedPrice,
    metadata,
    telegramPricing,
    usePlatformPrice
  });
  const originalPrice = mrp.value;
  const store = isShortenerUrl(finalUrl) || !safeHost(finalUrl) ? GENIE_LOOT_STORE : inferStore(finalUrl);
  const metadataTitle = isUsableProductTitle(metadata.title) ? metadata.title : "";
  const update = {
    updated_at: new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    source_updated_at: new Date().toISOString()
  };

  if (finalUrl && finalUrl !== deal.source_url) {
    update.source_url = finalUrl;
    update.affiliate_link = finalUrl;
    update.platform_product_url = finalUrl;
  }

  const productImageUrl = metadata.imageUrl || amazonImageFromUrl(finalUrl);
  if (productImageUrl && productImageUrl !== deal.image_url && shouldReplaceImage(deal.image_url, productImageUrl)) {
    update.image_url = productImageUrl;
  }

  if (productImageUrl) {
    update.raw_source_payload = {
      ...existingPayload,
      productImageUrl
    };
  }

  if (metadataTitle && shouldReplaceTitle(deal.title, metadataTitle)) {
    update.title = truncateClean(metadataTitle, 96);
    update.description = truncateClean(metadata.description || metadataTitle, 220);
  } else if (isShortenerTitle(deal.title) || isBadProductTitle(deal.title) || isLowSignalTitle(deal.title)) {
    const recoveredTitle = titleFromTelegramText(originalText) || titleFromProductUrl(finalUrl);
    if (recoveredTitle) {
      update.title = truncateClean(recoveredTitle, 96);
      update.description = truncateClean(removeUrls(originalText || recoveredTitle), 220);
    }
  } else if (metadata.description && !deal.description) {
    update.description = truncateClean(metadata.description, 220);
  }

  if (discountedPrice > 0 && Math.abs(discountedPrice - currentPrice) >= 0.01) {
    update.discounted_price = discountedPrice;
  }

  if (originalPrice > 0 && Math.abs(originalPrice - currentOriginal) >= 0.01) {
    update.original_price = originalPrice;
  }

  if (
    Object.prototype.hasOwnProperty.call(update, "discounted_price") ||
    Object.prototype.hasOwnProperty.call(update, "original_price")
  ) {
    update.discount_percentage = calculateDiscount(originalPrice, discountedPrice);
    update.is_featured = update.discount_percentage >= 50 || discountedPrice === 0;
  }

  if (store) {
    update.store_id = await ensureStore(store);
  }

  if (String(deal.coupon_code || "").toUpperCase() === "TINYURL") {
    update.coupon_code = "";
    update.source = discountedPrice === 0 ? "FREE_DEAL" : "DISCOUNT";
  }

  update.raw_source_payload = {
    ...(update.raw_source_payload || existingPayload),
    enrichedAt: new Date().toISOString(),
    resolvedProductUrl: finalUrl,
    resolvedHost: safeHost(finalUrl),
    productPageStatus: page.status,
    productMetadataFound: Boolean(metadata.title || metadata.imageUrl || metadata.discountedPrice),
    priceSource: usePlatformPrice ? metadata.priceSource : telegramPricing.hasDiscountedPrice ? "telegram-text" : "existing",
    mrpSource: mrp.source
  };

  return update;
}

function extractProductMetadata(html, pageUrl) {
  if (!html) return {};

  const jsonLdProducts = findProductJsonLd(html);
  const product = jsonLdProducts[0] || {};
  const offer = firstObject(product.offers) || {};
  const title = cleanText(
    stringValue(product.name) ||
    metaContent(html, "og:title") ||
    metaContent(html, "twitter:title") ||
    titleTag(html)
  );
  const description = cleanText(
    stringValue(product.description) ||
    metaContent(html, "og:description") ||
    metaContent(html, "description")
  );
  const imageUrl = absoluteUrl(
    stringValue(firstValue(product.image)) ||
    metaContent(html, "og:image") ||
    metaContent(html, "twitter:image") ||
    amazonImageFromHtml(html),
    pageUrl
  );
  const canonicalUrl = absoluteUrl(
    canonicalUrlFromHtml(html) ||
    metaContent(html, "og:url") ||
    amazonProductUrlFromHtml(html),
    pageUrl
  );
  const discountedPriceCandidate = firstMoneyCandidate([
    ["json-ld-offer", offer.price],
    ["json-ld-low-price", offer.lowPrice],
    ["product-meta-price", metaContent(html, "product:price:amount")],
    ["og-meta-price", metaContent(html, "og:price:amount")],
    ["amazon-core-price", amazonCurrentPriceFromHtml(html, pageUrl)]
  ]);
  const discountedPrice = discountedPriceCandidate.value;
  const originalPriceCandidate = firstMoneyCandidate([
    ["product-meta-original-price", metaContent(html, "product:original_price:amount")],
    ["og-meta-standard-price", metaContent(html, "og:price:standard_amount")],
    ["amazon-platform-mrp", amazonOriginalPriceFromHtml(html, pageUrl)]
  ]);
  const originalPrice = originalPriceCandidate.value;

  return {
    title: stripMarketplaceSuffix(title),
    description,
    imageUrl,
    canonicalUrl,
    discountedPrice,
    originalPrice,
    priceReliable: discountedPrice > 0,
    priceSource: discountedPriceCandidate.source,
    originalPriceReliable: originalPrice > 0,
    originalPriceSource: originalPriceCandidate.source
  };
}

function findProductJsonLd(html) {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const products = [];

  for (const script of scripts) {
    const body = decodeHtml(script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim());
    try {
      collectProductObjects(JSON.parse(body), products);
    } catch {
      continue;
    }
  }

  return products;
}

function collectProductObjects(value, products) {
  if (Array.isArray(value)) {
    for (const item of value) collectProductObjects(item, products);
    return;
  }

  if (!isObject(value)) return;

  const type = firstValue(value["@type"]);
  if (String(type || "").toLowerCase() === "product") {
    products.push(value);
  }

  if (Array.isArray(value["@graph"])) {
    collectProductObjects(value["@graph"], products);
  }
}

async function ensureStore(store) {
  const { data, error } = await supabaseAdmin
    .from("stores")
    .upsert({
      name: store.name,
      slug: store.slug,
      website_url: store.websiteUrl,
      logo_url: `https://www.google.com/s2/favicons?domain=${store.host}&sz=128`,
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();

  throwIfSupabaseError(error, "stores");
  return data?.id || null;
}

async function runPool(items, concurrency, worker) {
  const results = [];
  let index = 0;

  async function next() {
    while (index < items.length) {
      const itemIndex = index;
      index += 1;
      results[itemIndex] = await worker(items[itemIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
  return results;
}

function inferStore(url) {
  const host = safeHost(url);
  if (!host) return null;

  const rules = [
    ["amazon.", "Amazon"],
    ["amzn.", "Amazon"],
    ["flipkart.", "Flipkart"],
    ["myntra.", "Myntra"],
    ["ajio.", "Ajio"],
    ["meesho.", "Meesho"],
    ["snapdeal.", "Snapdeal"],
    ["nykaa.", "Nykaa"],
    ["firstcry.", "FirstCry"],
    ["shopsy.", "Shopsy"],
    ["jiomart.", "JioMart"],
    ["croma.", "Croma"],
    ["tatacliq.", "TataCliq"]
  ];
  const match = rules.find(([needle]) => host.includes(needle));
  const name = match?.[1] || host.replace(/^www\./, "").split(".")[0].replace(/^\w/, (letter) => letter.toUpperCase());

  return {
    host,
    name,
    slug: slugify(name),
    websiteUrl: `https://${host}`
  };
}

function shouldReplaceTitle(existingTitle, candidateTitle) {
  const existing = cleanText(existingTitle);
  const candidate = cleanText(candidateTitle);
  if (candidate.length < 8 || candidate.length > 160) return false;
  if (isShortenerTitle(existing)) return true;
  if (existing.length < 24) return true;
  if (/^(grab|loot|looot|[\W\d\s]+)$/i.test(existing)) return true;
  return false;
}

function bestProductUrl(deal, page, metadata) {
  const rawUrl = extractFirstExternalUrl(isObject(deal.raw_source_payload) ? deal.raw_source_payload.originalText : "");
  const candidates = [
    metadata.canonicalUrl,
    page.finalUrl,
    rawUrl,
    deal.source_url,
    deal.affiliate_link
  ].map((url) => normalizeStoredUrl(url || ""));
  const usableCandidates = candidates.filter((url) => isHttpUrl(url) && !isBadResolvedUrl(url));

  return usableCandidates.find((url) => !isShortenerUrl(url)) ||
    usableCandidates[0] ||
    "";
}

function normalizeStoredUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "tinyurl.com" && parsed.pathname.startsWith("/preview/deprecated/")) {
      return `https://tinyurl.com/${parsed.pathname.split("/").filter(Boolean).at(-1)}`;
    }
  } catch {
    return url;
  }

  return url;
}

function normalizeAffiliateRedirectUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "redirect.viglink.com" && parsed.searchParams.get("u")) {
      return normalizeStoredUrl(decodeHtml(parsed.searchParams.get("u")));
    }
  } catch {
    return url;
  }

  return url;
}

function isBadResolvedUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname.toLowerCase();
    const decodedUrl = decodeHtml(url);

    if (decodedUrl.length > 900 || /[<>"\\]|&quot;/.test(decodedUrl)) return true;

    return host.startsWith("aax-") ||
      (host.includes("amazon.") && (
        path.startsWith("/advertising/") ||
        path.startsWith("/x/") ||
        path.includes("/gp/slredirect")
      ));
  } catch {
    return true;
  }
}

function metaRefreshTarget(html, baseUrl) {
  const tag = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]*>/i)?.[0] || "";
  const content = tag.match(/content=["']([^"']*(?:'[^']*')?[^"']*)["']/i)?.[1] || "";
  const target = decodeHtml(content.match(/url=(.+)$/i)?.[1] || "").replace(/^['"]|['"]$/g, "").trim();
  if (!target) return "";
  return absoluteUrl(normalizeAffiliateRedirectUrl(target), baseUrl);
}

function canonicalUrlFromHtml(html) {
  const patterns = [
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return "";
}

function amazonImageFromHtml(html) {
  const landingImage = html.match(/id=["']landingImage["'][^>]+src=["']([^"']+)["']/i)?.[1] || "";
  if (landingImage) return decodeHtml(landingImage);

  const dynamicImage = html.match(/data-a-dynamic-image=["']({[^"']+})["']/i)?.[1] || "";
  if (!dynamicImage) return "";

  try {
    const parsed = JSON.parse(decodeHtml(dynamicImage));
    return Object.keys(parsed)[0] || "";
  } catch {
    return "";
  }
}

function amazonImageFromUrl(value) {
  const asin = amazonAsinFromUrl(value);
  return asin
    ? `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${encodeURIComponent(asin)}&Format=_SL500_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1`
    : "";
}

function amazonAsinFromUrl(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (!host.includes("amazon.")) return "";

    const path = decodeURIComponent(parsed.pathname);
    return path.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1]?.toUpperCase() || "";
  } catch {
    return "";
  }
}

function shouldReplaceImage(currentImage, nextImage) {
  if (!isHttpUrl(nextImage)) return false;
  if (!isHttpUrl(currentImage)) return true;
  return isTelegramPreviewImage(currentImage) || isKnownGenericImage(currentImage);
}

function isTelegramPreviewImage(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return host.includes("telesco.pe") || host.includes("cdn-telegram.org");
  } catch {
    return false;
  }
}

function isKnownGenericImage(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return host.includes("images.unsplash.com");
  } catch {
    return false;
  }
}

function amazonProductUrlFromHtml(html) {
  const canonical = html.match(/https:\/\/www\.amazon\.in\/[^"'<>]+\/dp\/([A-Z0-9]{10})[^"'<>]*/i)?.[0] || "";
  if (canonical) return canonical;

  const asin = html.match(/\b(?:ASIN|parentAsin|currentAsin)["']?\s*[:=]\s*["']([A-Z0-9]{10})["']/i)?.[1] || "";
  return asin ? `https://www.amazon.in/dp/${asin}` : "";
}

function extractFirstExternalUrl(value) {
  const urls = String(value || "").match(/https?:\/\/[^\s)>\]]+/gi) || [];
  return urls.map((url) => url.replace(/[),.]+$/g, "")).find((url) => !isTelegramUrl(url)) || "";
}

function titleFromTelegramText(value) {
  const lines = removeUrls(value)
    .split(/\r?\n/)
    .map(cleanText)
    .filter(Boolean)
    .filter((line) => !isShortenerTitle(line))
    .filter((line) => !isBadProductTitle(line))
    .filter((line) => !isLowSignalTitle(line));

  return lines.find((line) => /[a-z0-9]/i.test(line) && line.length > 6) || "";
}

function titleFromProductUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const productMarkerIndex = parts.findIndex((part) =>
      part.toLowerCase() === "dp" ||
      part.toLowerCase() === "product" ||
      /^[A-Z0-9]{10}$/i.test(part)
    );
    const slugParts = productMarkerIndex > 0 ? parts.slice(0, productMarkerIndex) : [];
    const slug = slugParts.find((part) => /[a-z]/i.test(part) && !/^(gp|dp)$/i.test(part));
    if (!slug) return "";

    return toTitleCase(decodeURIComponent(slug).replace(/[-_+]+/g, " "));
  } catch {
    return "";
  }
}

function isUsableProductTitle(value) {
  const title = cleanText(value);
  return title.length >= 8 &&
    title.length <= 180 &&
    !isShortenerTitle(title) &&
    !isBadProductTitle(title) &&
    !isLowSignalTitle(title);
}

function isBadProductTitle(value) {
  const title = cleanText(value);
  return /^(page not found|not found|access denied|robot check|captcha|just a moment|amazon\.in|amazon|error|oops)$/i.test(title) ||
    /\b(page not found|robot check|enter the characters you see below|sorry, we just need to make sure)\b/i.test(title);
}

function isLowSignalTitle(value) {
  const words = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return true;

  const productWords = words.filter((word) => !/^\d+$/.test(word) && ![
    "at",
    "buy",
    "coupon",
    "deal",
    "discount",
    "for",
    "free",
    "grab",
    "inr",
    "loot",
    "looot",
    "loooto",
    "max",
    "maximum",
    "min",
    "minimum",
    "mrp",
    "off",
    "offer",
    "only",
    "price",
    "qnty",
    "qty",
    "rs",
    "sale"
  ].includes(word));

  return productWords.length === 0 || productWords.join("").length < 4;
}

function isShortenerTitle(value) {
  return /tinyurl|url shortener|branded short links/i.test(cleanText(value));
}

function metaContent(html, name) {
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

function titleTag(html) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
}

function priceFromText(html) {
  const text = cleanText(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " "));
  const match = text.match(/(?:\u20b9|Rs\.?|INR)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
  return match ? money(match[1]) : 0;
}

function originalPriceFromText(html) {
  const text = cleanText(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " "));
  const match = text.match(/(?:MRP|List Price|Original Price)[^\u20b9\d]{0,80}(?:\u20b9|Rs\.?|INR)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
  return match ? money(match[1]) : 0;
}

function telegramPricingFromText(text) {
  const value = String(text || "");
  if (/\bfree\b|(?:\u20b9|rs\.?|inr)\s*0(?:\.00)?\b/i.test(value)) {
    return { hasDiscountedPrice: true, discountedPrice: 0, originalPrice: originalPriceFromDealText(value) };
  }

  const originalPrice = originalPriceFromDealText(value);
  const explicitPrice = explicitDealPriceFromText(value);
  if (explicitPrice > 0) {
    return { hasDiscountedPrice: true, discountedPrice: explicitPrice, originalPrice };
  }

  const prices = dealPriceCandidates(value);
  if (originalPrice > 0) {
    const belowOriginal = prices.filter((price) => price > 0 && price < originalPrice);
    const discountedPrice = belowOriginal.length ? Math.min(...belowOriginal) : 0;
    if (discountedPrice > 0) return { hasDiscountedPrice: true, discountedPrice, originalPrice };
  }

  if (prices.length >= 2) {
    return { hasDiscountedPrice: true, discountedPrice: Math.min(...prices), originalPrice: Math.max(originalPrice, ...prices) };
  }

  if (prices.length === 1) {
    return { hasDiscountedPrice: true, discountedPrice: prices[0], originalPrice: Math.max(originalPrice, prices[0]) };
  }

  return { hasDiscountedPrice: false, discountedPrice: 0, originalPrice };
}

function chooseMrp({ currentOriginal, discountedPrice, metadata, telegramPricing, usePlatformPrice }) {
  const platformMrp = metadata.originalPriceReliable && metadata.originalPrice >= discountedPrice
    ? metadata.originalPrice
    : 0;

  if (usePlatformPrice) {
    return {
      source: platformMrp > 0 ? metadata.originalPriceSource : "platform-price-no-mrp",
      value: platformMrp > 0 ? platformMrp : discountedPrice
    };
  }

  if (telegramPricing.originalPrice >= discountedPrice && telegramPricing.originalPrice > 0) {
    return { source: "telegram-text-mrp", value: telegramPricing.originalPrice };
  }

  return { source: "matched-current-price", value: discountedPrice };
}

function explicitDealPriceFromText(text) {
  const patterns = [
    /(?:@|at|for|only|just|deal price|offer price|sale price|now|price)\s*(?:\u20b9|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    /(?:\u20b9|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i
  ];

  for (const pattern of patterns) {
    const price = money(String(text || "").match(pattern)?.[1]);
    if (price > 0) return price;
  }

  return 0;
}

function originalPriceFromDealText(text) {
  const match = String(text || "").match(/(?:mrp|list price|original price|regular price)[^\u20b9\d]{0,40}(?:\u20b9|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
  return money(match?.[1]);
}

function dealPriceCandidates(text) {
  const candidates = new Set();
  const value = String(text || "");
  const currencyPattern = /(?:\u20b9|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)|([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr)\b/gi;
  const shorthandPattern = /(?:@|at|only|just|for)\s*(?:\u20b9|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;

  for (const match of value.matchAll(currencyPattern)) {
    const price = money(match[1] || match[2]);
    if (price > 0) candidates.add(price);
  }

  for (const match of value.matchAll(shorthandPattern)) {
    const price = money(match[1]);
    if (price > 0) candidates.add(price);
  }

  for (const candidate of unlabeledNumericPriceCandidates(value)) {
    candidates.add(candidate);
  }

  return [...candidates].filter((price) => price >= 10).sort((a, b) => a - b);
}

function unlabeledNumericPriceCandidates(text) {
  const candidates = [];
  const value = String(text || "");
  const unitPattern = /^(g|gm|gram|grams|kg|ml|l|ltr|liter|litre|mah|gb|tb|mb|inch|cm|mm|pcs|pc|pack|packs|count|counts|x)\b/i;

  for (const match of value.matchAll(/\b([0-9][0-9,]*(?:\.[0-9]{1,2})?)\b/g)) {
    const price = money(match[1]);
    if (price < 10) continue;

    const before = value.slice(Math.max(0, (match.index || 0) - 14), match.index || 0);
    const after = value.slice((match.index || 0) + match[0].length, (match.index || 0) + match[0].length + 14);
    if (unitPattern.test(after.trim())) continue;
    if (/(?:x|pack of|qty|qnty|size)\s*$/i.test(before.trim())) continue;
    if (/\b(?:mrp|list price|original price|regular price)\W*$/i.test(before.trim())) continue;

    candidates.push(price);
  }

  return candidates;
}

function amazonCurrentPriceFromHtml(html, pageUrl) {
  if (!isAmazonProductUrl(pageUrl)) return 0;
  const block = amazonPriceBlock(html);
  if (!block) return 0;

  return firstMoney([
    attributeValueFromHtml(block, "data-a-price"),
    textMatch(block, /id=["']priceblock_(?:dealprice|ourprice|saleprice)["'][^>]*>\s*(?:\u20b9|Rs\.?|INR)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i),
    textMatch(block, /class=["'][^"']*a-price-whole[^"']*["'][^>]*>\s*([0-9][0-9,]*)/i),
    textMatch(block, /class=["'][^"']*a-offscreen[^"']*["'][^>]*>\s*(?:\u20b9|Rs\.?|INR)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i)
  ]);
}

function amazonOriginalPriceFromHtml(html, pageUrl) {
  if (!isAmazonProductUrl(pageUrl)) return 0;
  const block = amazonPriceBlock(html);
  if (!block) return 0;

  return firstMoney([
    textMatch(block, /(?:M\.?R\.?P\.?|List Price|Was Price)[\s\S]{0,500}?(?:\u20b9|Rs\.?|INR)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i),
    textMatch(block, /class=["'][^"']*a-text-price[^"']*["'][^>]*>\s*<span[^>]+class=["'][^"']*a-offscreen[^"']*["'][^>]*>\s*(?:\u20b9|Rs\.?|INR)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i),
    textMatch(block, /class=["'][^"']*a-offscreen[^"']*["'][^>]*>\s*(?:\u20b9|Rs\.?|INR)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)[\s\S]{0,250}?class=["'][^"']*a-price[^"']*a-text-price/i)
  ]);
}

function amazonPriceBlock(html) {
  const index = html.search(/id=["']corePriceDisplay/i);
  return index >= 0 ? html.slice(index, index + 9000) : "";
}

function isAmazonProductUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname.toLowerCase();
    return host.includes("amazon.") && (path.includes("/dp/") || path.includes("/gp/product/"));
  } catch {
    return false;
  }
}

function attributeValueFromHtml(html, attributeName) {
  const escaped = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return decodeHtml(html.match(new RegExp(`${escaped}=["']([^"']+)["']`, "i"))?.[1] || "");
}

function textMatch(value, pattern) {
  return decodeHtml(String(value || "").match(pattern)?.[1] || "");
}

function firstMoney(values) {
  for (const value of values) {
    const numeric = money(value);
    if (numeric > 0) return numeric;
  }
  return 0;
}

function firstMoneyCandidate(candidates) {
  for (const [source, value] of candidates) {
    const numeric = money(value);
    if (numeric > 0) return { source, value: numeric };
  }
  return { source: "", value: 0 };
}

function calculateDiscount(originalPrice, discountedPrice) {
  if (originalPrice <= 0) return discountedPrice === 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)));
}

function absoluteUrl(value, baseUrl) {
  if (!value) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function firstObject(value) {
  const item = firstValue(value);
  return isObject(item) ? item : null;
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function stringValue(value) {
  const item = firstValue(value);
  return typeof item === "string" || typeof item === "number" ? String(item) : "";
}

function stripMarketplaceSuffix(value) {
  return cleanText(value)
    .replace(/\s*:\s*Amazon\.in\s*:.*$/i, "")
    .replace(/\s*\|\s*(Amazon\.in|Flipkart|Myntra|Ajio|Meesho|Snapdeal|Nykaa|FirstCry|Croma|TataCliq).*$/i, "")
    .trim();
}

function safeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isTelegramUrl(value) {
  const host = safeHost(value);
  return host === "t.me" || host === "telegram.me";
}

function isShortenerUrl(value) {
  const host = safeHost(value);
  return [
    "tinyurl.com",
    "bit.ly",
    "cutt.ly",
    "shorturl.at",
    "t.co",
    "goo.gl"
  ].includes(host);
}

function slugify(value) {
  return cleanText(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "store";
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncateClean(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength + 1);
  return truncated.slice(0, truncated.lastIndexOf(" ")).trim() || text.slice(0, maxLength).trim();
}

function removeUrls(value) {
  return String(value || "").replace(/https?:\/\/[^\s)>\]]+/gi, " ");
}

function toTitleCase(value) {
  return cleanText(value).replace(/\b([a-z])([a-z]*)/gi, (_, first, rest) =>
    `${first.toUpperCase()}${rest.toLowerCase()}`
  );
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function money(value) {
  const numeric = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : 0;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

module.exports = { enrichGenieLootDetails };
