const { supabaseAdmin } = require("../config/supabaseClient");
const authRepository = require("../repositories/authRepository");
const dealRepository = require("../repositories/dealRepository");
const wishlistRepository = require("../repositories/wishlistRepository");
const { parseTelegramDeal, validateFilteredDeal } = require("../../lib/dealFilter");
const { hashOtp, normalizeIndianMobile, testOtp, useTestOtp } = require("../../lib/otp");

async function comparePrice(req, res, next) {
  try {
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

    const payload = toCurrentDealRow(deal);
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

function toCurrentDealRow(deal) {
  const now = new Date().toISOString();
  return {
    title: deal.productTitle,
    slug: slugify(`${deal.productTitle}-${deal.platform}`),
    description: deal.productTitle,
    original_price: deal.originalPrice,
    discounted_price: deal.dealPrice,
    discount_percentage: deal.discountPercent,
    coupon_code: deal.couponCode || "",
    affiliate_link: deal.productUrl,
    image_url: deal.imageUrl || "",
    expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    is_featured: deal.isHotDeal || deal.isSuperHotDeal,
    is_verified: true,
    source: "TELEGRAM_FILTER",
    source_url: deal.productUrl,
    dedupe_key: deal.dedupeKey,
    last_scraped_at: now,
    raw_source_payload: {
      connectorMode: "telegram-page",
      platform: deal.platform,
      deal_score: deal.dealScore,
      is_super_hot_deal: deal.isSuperHotDeal,
      is_best_price: deal.isBestPrice,
      scraped_from_channel: deal.sourceChannel,
      telegram_message_id: deal.telegramMessageId
    },
    updated_at: now
  };
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
