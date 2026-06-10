const { supabaseAdmin } = require("../config/supabaseClient");
const authRepository = require("../repositories/authRepository");
const dealRepository = require("../repositories/dealRepository");
const priceComparisonRepository = require("../repositories/priceComparisonRepository");
const wishlistRepository = require("../repositories/wishlistRepository");
const { parseTelegramDeal, validateFilteredDeal } = require("../../lib/dealFilter");
const { hashOtp, normalizeIndianMobile, testOtp, useTestOtp } = require("../../lib/otp");

async function comparePrice(req, res, next) {
  try {
    const productId = String(req.query.productId || req.query.product_id || "").trim();
    if (productId) {
      const comparison = await priceComparisonRepository.getPriceComparisonSummary(productId);
      if (!comparison) return res.status(404).json({ success: false, message: "No price comparison found" });
      return res.json({ success: true, ...comparison });
    }

    const product = String(req.query.product || "").trim();
    if (!product) return res.status(400).json({ success: false, message: "product query is required" });

    const result = await dealRepository.listDeals({ search: product, limit: 25, sort: "price" });
    const prices = result.deals
      .filter((deal) => Number(deal.discountedPrice || deal.currentPrice || 0) > 0)
      .map((deal) => ({
        platform: deal.storeName || "Store",
        price: Number(deal.discountedPrice || deal.currentPrice || 0),
        url: deal.dealUrl || deal.productUrl || ""
      }))
      .sort((a, b) => a.price - b.price);

    if (!prices.length) return res.status(404).json({ success: false, message: "No price comparison found" });
    return res.json({
      success: true,
      product,
      best_platform: prices[0].platform,
      lowest_price: prices[0].price,
      prices
    });
  } catch (error) {
    next(error);
  }
}

async function filterTelegramDeal(req, res, next) {
  try {
    const deal = parseTelegramDeal(req.body || {});
    const rejection = validateFilteredDeal(deal);
    if (rejection) return res.status(400).json({ success: false, message: "Deal rejected", reason: rejection });

    const existing = await findExistingDeal(deal);
    if (existing && Number(existing.discounted_price || 0) <= deal.dealPrice) {
      return res.json({ success: false, message: "Deal rejected", reason: "Duplicate deal already exists" });
    }

    const payload = await toCurrentDealRow(deal);
    const query = existing
      ? supabaseAdmin.from("deals").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", existing.id)
      : supabaseAdmin.from("deals").insert(payload);

    const { data, error } = await query.select("*").single();
    if (error) throw error;

    return res.json({ success: true, message: "Deal filtered and saved successfully", deal: data });
  } catch (error) {
    next(error);
  }
}

async function sendWhatsAppOtp(req, res, next) {
  try {
    if (useTestOtp()) {
      await storeOtp(req.body?.mobile, testOtp());
      return res.json({ success: true, message: `Test OTP enabled. Use ${testOtp()}.` });
    }
    const result = await authRepository.requestWhatsAppOtp(req.body || {});
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function verifyWhatsAppOtp(req, res, next) {
  try {
    if (useTestOtp()) {
      const otp = String(req.body?.otp || "");
      return otp === testOtp()
        ? res.json({ success: true, message: "OTP verified successfully" })
        : res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }
    const result = await authRepository.verifyWhatsAppOtp(req.body || {});
    return res.json({ success: true, message: "OTP verified successfully", data: result });
  } catch (_error) {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }
}

async function savedDeals(req, res, next) {
  try {
    if (req.method === "GET") {
      const userId = req.query.userId || req.query.user_id;
      if (!userId) return res.status(400).json({ success: false, message: "userId is required" });
      const data = await wishlistRepository.getWishlist(userId);
      return res.json({ success: true, count: data.length, saved_deals: data });
    }

    if (req.method === "POST") {
      const data = await wishlistRepository.addToWishlist(req.body || {});
      return res.json({ success: true, message: "Deal saved", saved_deal: data });
    }

    if (req.method === "DELETE") {
      const userId = req.body?.userId || req.body?.user_id;
      const dealId = req.body?.dealId || req.body?.deal_id;
      const data = await wishlistRepository.removeFromWishlist(userId, dealId);
      return res.json({ success: true, message: "Deal removed", result: data });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    next(error);
  }
}

async function findExistingDeal(deal) {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("*")
    .or(`dedupe_key.eq.${deal.dedupeKey},source_url.eq.${deal.productUrl}`)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function toCurrentDealRow(deal) {
  const now = new Date().toISOString();
  const storeId = await ensureStore(deal.platform || "Telegram");
  const categoryName = inferCategoryName(`${deal.productTitle} ${deal.platform}`);
  const categoryId = await ensureCategory(categoryName);
  const sourceProductId = platformProductId(deal.productUrl) || deal.productUrl;
  return {
    title: deal.productTitle,
    slug: slugify(`${deal.productTitle}-${deal.platform}`),
    description: deal.productTitle,
    store_id: storeId,
    category_id: categoryId,
    original_price: deal.originalPrice,
    discounted_price: deal.dealPrice,
    discount_percentage: deal.discountPercent,
    coupon_code: deal.couponCode || "",
    affiliate_link: deal.productUrl,
    image_url: deal.imageUrl || "",
    source_image_url: deal.imageUrl || "",
    platform_product_url: deal.productUrl,
    expiry_date: null,
    platform_expires_at: null,
    status: "active",
    is_featured: deal.isHotDeal || deal.isSuperHotDeal,
    is_verified: true,
    source: "TELEGRAM_FILTER",
    source_url: deal.productUrl,
    source_product_id: sourceProductId,
    dedupe_key: deal.dedupeKey,
    last_scraped_at: now,
    raw_source_payload: {
      connectorMode: "telegram-page",
      platform: deal.platform,
      categoryName,
      platformProductId: sourceProductId,
      deal_score: deal.dealScore,
      is_super_hot_deal: deal.isSuperHotDeal,
      is_best_price: deal.isBestPrice,
      scraped_from_channel: deal.sourceChannel,
      telegram_message_id: deal.telegramMessageId
    },
    updated_at: now
  };
}

async function ensureStore(platform) {
  const storeName = String(platform || "Telegram").trim() || "Telegram";
  const slug = slugify(storeName);
  const { data, error } = await supabaseAdmin
    .from("stores")
    .upsert({
      name: storeName,
      slug,
      website_url: "",
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw error;
  return data?.id || null;
}

async function ensureCategory(categoryName) {
  const name = categoryName || "Other Deals";
  const { data, error } = await supabaseAdmin
    .from("categories")
    .upsert({
      name,
      slug: slugify(name),
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw error;
  return data?.id || null;
}

function inferCategoryName(text) {
  const value = String(text || "").toLowerCase();
  if (/laptop|notebook|macbook/.test(value)) return "Laptop";
  if (/phone|mobile|smartphone/.test(value)) return "Mobile";
  if (/flipkart|fkrt|flpkrt/.test(value)) return "Flipkart Deals";
  if (/amazon|amzn/.test(value)) return "Amazon Deals";
  if (/shirt|shoe|jeans|dress|fashion|bag|kurta|saree/.test(value)) return "Fashion";
  if (/grocery|food|snack|tea|coffee/.test(value)) return "Grocery";
  if (/beauty|skin|makeup|cosmetic|cream|serum/.test(value)) return "Beauty";
  if (/appliance|mixer|grinder|washing|fridge|microwave|air conditioner/.test(value)) return "Appliances";
  if (/home|kitchen|storage|container|bottle|furniture/.test(value)) return "Home & Kitchen";
  if (/earbud|speaker|watch|camera|charger|tablet|headphone|tv/.test(value)) return "Electronics";
  return "Other Deals";
}

function platformProductId(productUrl) {
  try {
    const parsed = new URL(productUrl);
    const asin = decodeURIComponent(parsed.pathname).match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1];
    if (asin) return `amazon:${asin.toUpperCase()}`;
    parsed.hash = "";
    ["tag", "utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach((key) => parsed.searchParams.delete(key));
    return parsed.toString();
  } catch {
    return "";
  }
}

async function storeOtp(mobile, otp) {
  const normalizedMobile = normalizeIndianMobile(mobile);
  if (!normalizedMobile) return;
  const { error } = await supabaseAdmin.from("otp_verifications").insert({
    mobile: normalizedMobile,
    otp_hash: hashOtp(normalizedMobile, otp),
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  });
  if (error) {
    console.warn("OTP verification table write skipped:", error.message);
  }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || `deal-${Date.now()}`;
}

module.exports = {
  comparePrice,
  filterTelegramDeal,
  savedDeals,
  sendWhatsAppOtp,
  verifyWhatsAppOtp
};
