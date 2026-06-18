const { supabaseAdmin } = require("../config/supabaseClient");
const { toApiDeal } = require("../mappers/dealMapper");
const { fetchProductMetadata } = require("../services/dealDetailEnricher");
const { getPagination } = require("../utils/pagination");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const TABLE = "scraped_deal_items";

async function listScrapedDeals(filters) {
  const { page, limit, from, to } = getPagination(filters);
  let query = supabaseAdmin
    .from(TABLE)
    .select("*, deal_sources(source_name), deals(*, categories(*), stores(*))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status) {
    query = query.eq("status", normalizeStatus(filters.status));
  }

  if (filters.sourceKey) {
    query = query.eq("source_key", String(filters.sourceKey));
  }

  const { data, error, count } = await query;
  throwIfSupabaseError(error, TABLE);

  return {
    items: (data || []).map(toApiScrapedDealItem),
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

async function listTelegramDeals(filters) {
  const { page, limit, from, to } = getPagination(filters);
  const review = String(filters.review || filters.section || "all").trim().toLowerCase();
  let query = supabaseAdmin
    .from("deals")
    .select("*, categories(*), stores(*)", { count: "exact" })
    .or("source_type.eq.telegram,telegram_channel.not.is.null,raw_source_payload->>connectorMode.eq.telegram-channel")
    .order("last_scraped_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (review === "price" || review === "needs_price_review") {
    query = query.eq("price_status", "manual_required");
  } else if (review === "expiry" || review === "needs_expiry_review") {
    query = query.eq("expiry_status", "manual_required");
  } else if (review === "expired") {
    query = query.or("is_expired.eq.true,status.eq.expired");
  } else if (review === "pending") {
    query = query.eq("admin_review_status", "needs_review");
  }

  const { data, error, count } = await query;
  throwIfSupabaseError(error, "deals");
  return {
    items: (data || []).map(toApiDeal),
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

async function listScrapeLogs(filters) {
  const { page, limit, from, to } = getPagination(filters);
  let query = supabaseAdmin
    .from("scrape_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status) query = query.eq("scrape_status", String(filters.status));
  if (filters.channel) query = query.eq("source_channel", String(filters.channel));

  const { data, error, count } = await query;
  throwIfSupabaseError(error, "scrape_logs");
  return {
    items: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

async function updateManualPrice(dealId, payload = {}) {
  const priceMin = numericOrNull(payload.priceMin ?? payload.price_min);
  const priceMax = numericOrNull(payload.priceMax ?? payload.price_max);
  const note = String(payload.manualPriceNote ?? payload.manual_price_note ?? "").trim();
  if (priceMin === null && priceMax === null) {
    const error = new Error("Price minimum or maximum is required.");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const activePrice = priceMin ?? priceMax ?? 0;
  const { data, error } = await supabaseAdmin
    .from("deals")
    .update({
      price_min: priceMin,
      price_max: priceMax,
      manual_price_note: note || "Price range added by admin.",
      price_status: "manual_added",
      admin_review_status: "approved",
      discounted_price: activePrice,
      original_price: priceMax || priceMin,
      status: "active",
      is_verified: true,
      updated_at: now
    })
    .eq("id", dealId)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(error, "deals");
  return toApiDeal(data);
}

async function updateManualExpiry(dealId, payload = {}) {
  const expiryAt = normalizeExpiryInput(payload.expiryAt ?? payload.expiry_at, payload.expiryDate ?? payload.expiry_date, payload.expiryTime ?? payload.expiry_time);
  const note = String(payload.expiryNote ?? payload.expiry_note ?? "").trim();
  if (!expiryAt) {
    const error = new Error("Expiry date/time is required.");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const expired = new Date(expiryAt).getTime() <= Date.now();
  const { data, error } = await supabaseAdmin
    .from("deals")
    .update({
      expiry_at: expiryAt,
      expiry_date: expiryAt,
      platform_expires_at: expiryAt,
      expiry_note: note || "Expiry added by admin.",
      expiry_status: "manual_added",
      admin_review_status: "approved",
      is_expired: expired,
      status: expired ? "expired" : "active",
      is_verified: !expired,
      updated_at: now
    })
    .eq("id", dealId)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(error, "deals");
  return toApiDeal(data);
}

async function markTelegramDealExpired(dealId, note = "") {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("deals")
    .update({
      is_expired: true,
      status: "expired",
      admin_review_status: "expired",
      expiry_note: note || "Marked expired by admin.",
      updated_at: now
    })
    .eq("id", dealId)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(error, "deals");
  return toApiDeal(data);
}

async function listFlaggedDeals(filters = {}) {
  const limit = Math.min(500, Math.max(1, Number(filters.limit || 100)));
  const verifyImages = String(filters.verifyImages || "").toLowerCase() === "true";
  const section = String(filters.section || filters.view || "all").toLowerCase();

  // For approved and rejected sections, fetch ALL deals with that status directly from the DB.
  // This guarantees these tabs always show the full list regardless of flags.
  if (section === "approved") {
    const { data, error } = await supabaseAdmin
      .from("deals")
      .select("*, categories(*), stores(*)")
      .in("status", ["approved", "active"])
      .order("created_at", { ascending: false })
      .limit(limit);
    throwIfSupabaseError(error, "deals");
    const imageStatus = verifyImages ? await checkImageStatuses(data || []) : new Map();
    const items = (data || []).map((row) => toFlaggedDeal(row, imageStatus.get(row.id)));
    return {
      items,
      summary: await getAdminSummary(items),
      pagination: { page: 1, limit, total: items.length, totalPages: 1 }
    };
  }

  if (section === "rejected") {
    const { data, error } = await supabaseAdmin
      .from("deals")
      .select("*, categories(*), stores(*)")
      .eq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(limit);
    throwIfSupabaseError(error, "deals");
    const imageStatus = verifyImages ? await checkImageStatuses(data || []) : new Map();
    const items = (data || []).map((row) => toFlaggedDeal(row, imageStatus.get(row.id)));
    return {
      items,
      summary: await getAdminSummary(items),
      pagination: { page: 1, limit, total: items.length, totalPages: 1 }
    };
  }

  // For all other sections (all/flagged, telegram, missing_image, zero_price,
  // price_mismatch, pending) — only load deals that actually have problems.
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("*, categories(*), stores(*)")
    .order("created_at", { ascending: false })
    .limit(limit);
  throwIfSupabaseError(error, "deals");

  const imageStatus = verifyImages ? await checkImageStatuses(data || []) : new Map();
  const includeStatusOnly = ["telegram", "pending"].includes(section);

  // For "all" section: include every deal. For specific sections: only problem deals.
  const items = (data || [])
    .map((row) => toFlaggedDeal(row, imageStatus.get(row.id)))
    .filter((item) =>
      section === "all" ||
      item.flags.length > 0 ||
      item.status === "pending_review" ||
      includeStatusOnly
    );

  return {
    items: filterFlaggedItems(items, filters),
    summary: await getAdminSummary(items),
    pagination: {
      page: 1,
      limit,
      total: items.length,
      totalPages: 1
    }
  };
}

async function updateAdminDeal(dealId, payload = {}, adminUser = {}) {
  const current = await findDeal(dealId);
  const update = await normalizeAdminDealUpdate(payload);
  if (!current.category_id && !update.category_id) {
    update.category_id = await ensureCategoryByName("Other Deals");
  }
  const merged = { ...current, ...update };
  validateAdminDealUpdate(merged, payload);
  const finalUpdate = finalizeAdminDealUpdate(current, update, payload);

  const { data, error } = await supabaseAdmin
    .from("deals")
    .update(finalUpdate)
    .eq("id", dealId)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(error, "deals");
  return toApiDeal(data);
}

async function approveAdminDeal(dealId, payload = {}, adminUser = {}) {
  const current = await enrichDealBeforeApproval(await findDeal(dealId));
  const categoryId = current.category_id || await ensureCategoryByName("Other Deals");
  const merged = { ...current, category_id: categoryId, status: "approved", is_valid: true, is_verified: true };
  validateAdminDealUpdate(merged, { ...payload, status: "approved" });

  const now = new Date().toISOString();
  const flags = buildValidationFlags(current, { allowMissingImage: Boolean(payload.allowMissingImage || payload.allow_missing_image) })
    .filter((flag) => flag !== "pending_review" && flag !== "invalid_deal");
  if (flags.length && !payload.allowFlags && !payload.allow_flags) {
    const error = new Error(`Deal still has unresolved flags: ${flags.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabaseAdmin
    .from("deals")
    .update({
      status: "approved",
      category_id: categoryId,
      is_valid: true,
      is_verified: true,
      admin_review_status: "approved",
      validation_flags: flags,
      approved_at: now,
      approved_by: adminIdentity(adminUser),
      rejected_at: null,
      rejected_reason: null,
      updated_at: now
    })
    .eq("id", dealId)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(error, "deals");
  return toApiDeal(data);
}

async function enrichDealBeforeApproval(deal) {
  const productUrl = dealProductUrl(deal);
  const needsImage = !dealImageUrl(deal);
  const needsPrice = !hasPositivePrice(deal) && !hasPriceRange(deal);

  if (!productUrl || (!needsImage && !needsPrice)) return deal;

  try {
    const metadata = await fetchProductMetadata(productUrl, { timeoutMs: 12000 });
    const update = buildApprovalEnrichmentUpdate(deal, metadata, { needsImage, needsPrice });
    if (!Object.keys(update).length) return deal;

    const { data, error } = await supabaseAdmin
      .from("deals")
      .update({
        ...update,
        updated_at: new Date().toISOString(),
        fetched_at: new Date().toISOString(),
        source_updated_at: new Date().toISOString()
      })
      .eq("id", deal.id)
      .select("*, categories(*), stores(*)")
      .single();
    throwIfSupabaseError(error, "deals");
    return data || deal;
  } catch (error) {
    console.warn("[admin-approval] product metadata enrichment skipped:", error.message || error);
    return deal;
  }
}

function buildApprovalEnrichmentUpdate(deal, metadata = {}, options = {}) {
  const update = {};
  const imageUrl = clean(metadata.imageUrl);
  const currentPrice = numberOrNull(metadata.discountedPrice);
  const originalPrice = numberOrNull(metadata.originalPrice);

  if (options.needsImage && isHttpUrl(imageUrl)) {
    update.image_url = imageUrl;
    update.source_image_url = imageUrl;
    update.final_image_url = imageUrl;
  }

  if (options.needsPrice && metadata.priceReliable && currentPrice && currentPrice > 0) {
    update.discounted_price = currentPrice;
    update.price_status = "detected";
    const resolvedOriginalPrice = originalPrice && originalPrice >= currentPrice
      ? originalPrice
      : Math.max(numberOrNull(deal.original_price) || 0, currentPrice);
    update.original_price = resolvedOriginalPrice;
    update.discount_percentage = calculateDiscount(resolvedOriginalPrice, currentPrice);
  }

  if (!clean(deal.title) && clean(metadata.title)) {
    update.title = truncateClean(metadata.title, 96);
  }
  if (!clean(deal.description) && clean(metadata.description)) {
    update.description = truncateClean(metadata.description, 220);
  }

  const existingPayload = isObject(deal.raw_source_payload) ? deal.raw_source_payload : {};
  update.raw_source_payload = {
    ...existingPayload,
    adminApprovalEnrichedAt: new Date().toISOString(),
    adminApprovalMetadataFound: Boolean(metadata.title || metadata.imageUrl || metadata.discountedPrice),
    adminApprovalPriceSource: metadata.priceSource || existingPayload.adminApprovalPriceSource || ""
  };

  return update;
}

async function rejectAdminDeal(dealId, reason = "", adminUser = {}) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("deals")
    .update({
      status: "rejected",
      is_valid: false,
      is_verified: false,
      admin_review_status: "rejected",
      rejected_at: now,
      rejected_reason: String(reason || "Rejected by admin.").trim(),
      updated_at: now
    })
    .eq("id", dealId)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(error, "deals");
  return toApiDeal(data);
}

async function flagAdminDeal(dealId, reason = "", adminUser = {}) {
  const current = await findDeal(dealId);
  const manualFlag = slugify(reason || "manual_review");
  const existingFlags = arrayFromJson(current.validation_flags);
  const flags = [...new Set([...existingFlags, manualFlag || "manual_review"])];
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("deals")
    .update({
      status: "pending_review",
      is_valid: false,
      is_verified: false,
      admin_review_status: "needs_review",
      admin_notes: appendNote(current.admin_notes, reason),
      validation_flags: flags,
      updated_at: now
    })
    .eq("id", dealId)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(error, "deals");
  return toApiDeal(data);
}

async function approveScrapedDeal(itemId) {
  const item = await findScrapedItem(itemId);
  const dealId = await resolveMatchedDealId(item);
  if (!dealId) {
    const error = new Error("No matched deal found for this scraped item.");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date().toISOString();
  const { data: deal, error: dealError } = await supabaseAdmin
    .from("deals")
    .update({ status: "active", is_verified: true, updated_at: now })
    .eq("id", dealId)
    .select("*, categories(*), stores(*)")
    .single();
  throwIfSupabaseError(dealError, "deals");

  const { data: updatedItem, error: itemError } = await supabaseAdmin
    .from(TABLE)
    .update({ status: "approved", matched_deal_id: dealId, error_message: "" })
    .eq("id", itemId)
    .select("*, deal_sources(source_name), deals(*, categories(*), stores(*))")
    .single();
  throwIfSupabaseError(itemError, TABLE);

  return {
    item: toApiScrapedDealItem(updatedItem),
    deal: toApiDeal(deal)
  };
}

async function rejectScrapedDeal(itemId, reason = "") {
  const item = await findScrapedItem(itemId);
  const dealId = await resolveMatchedDealId(item);
  const now = new Date().toISOString();

  if (dealId) {
    const { error: dealError } = await supabaseAdmin
      .from("deals")
      .update({ status: "rejected", is_verified: false, updated_at: now })
      .eq("id", dealId);
    throwIfSupabaseError(dealError, "deals");
  }

  const { data: updatedItem, error: itemError } = await supabaseAdmin
    .from(TABLE)
    .update({
      status: "rejected",
      matched_deal_id: dealId,
      error_message: reason || "Rejected by admin review."
    })
    .eq("id", itemId)
    .select("*, deal_sources(source_name), deals(*, categories(*), stores(*))")
    .single();
  throwIfSupabaseError(itemError, TABLE);

  return toApiScrapedDealItem(updatedItem);
}

async function findScrapedItem(itemId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*, deal_sources(source_name), deals(*, categories(*), stores(*))")
    .eq("id", itemId)
    .maybeSingle();
  throwIfSupabaseError(error, TABLE);

  if (!data) {
    const notFound = new Error("Scraped deal item not found.");
    notFound.statusCode = 404;
    throw notFound;
  }

  return data;
}

async function resolveMatchedDealId(item) {
  if (item.matched_deal_id) return item.matched_deal_id;
  if (!item.dedupe_key) return null;

  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("id")
    .eq("dedupe_key", item.dedupe_key)
    .maybeSingle();
  throwIfSupabaseError(error, "deals");
  return data?.id || null;
}

function toApiScrapedDealItem(row) {
  return {
    id: row.id,
    jobId: row.scraper_job_id,
    sourceKey: row.source_key,
    sourceName: row.deal_sources?.source_name || row.source_key,
    sourceProductId: row.source_product_id,
    sourceUrl: row.source_url,
    title: row.title,
    dedupeKey: row.dedupe_key,
    status: row.status,
    errorMessage: row.error_message,
    matchedDealId: row.matched_deal_id,
    rawPayload: row.raw_payload,
    normalizedPayload: row.normalized_payload,
    createdAt: row.created_at,
    deal: row.deals ? toApiDeal(row.deals) : null
  };
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function numericOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    const error = new Error("Price must be a valid non-negative number.");
    error.statusCode = 400;
    throw error;
  }
  return numeric;
}

function normalizeExpiryInput(expiryAt, expiryDate, expiryTime) {
  const direct = String(expiryAt || "").trim();
  if (direct) {
    const parsed = new Date(direct);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }
  const date = String(expiryDate || "").trim();
  if (!date) return "";
  const time = String(expiryTime || "23:59").trim();
  const parsed = new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

async function findDeal(dealId) {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("*, categories(*), stores(*)")
    .eq("id", dealId)
    .maybeSingle();
  throwIfSupabaseError(error, "deals");
  if (!data) {
    const notFound = new Error("Deal not found.");
    notFound.statusCode = 404;
    throw notFound;
  }
  return data;
}

async function normalizeAdminDealUpdate(payload = {}) {
  const update = {};
  assignText(update, "title", payload.title);
  assignText(update, "description", payload.description);
  assignText(update, "coupon_code", payload.couponCode ?? payload.coupon_code);
  assignText(update, "availability", payload.availability);
  assignText(update, "admin_notes", payload.adminNotes ?? payload.admin_notes);

  if (hasValue(payload.imageUrl) || hasValue(payload.image_url)) {
    const imageUrl = clean(payload.imageUrl ?? payload.image_url);
    update.image_url = imageUrl;
    update.final_image_url = imageUrl;
  }

  if (hasValue(payload.productUrl) || hasValue(payload.product_url) || hasValue(payload.dealUrl)) {
    const productUrl = clean(payload.productUrl ?? payload.product_url ?? payload.dealUrl);
    update.affiliate_link = productUrl;
    update.source_url = productUrl;
    update.platform_product_url = productUrl;
  }

  if (hasValue(payload.originalPrice) || hasValue(payload.original_price)) {
    update.original_price = moneyNumeric(payload.originalPrice ?? payload.original_price);
  }
  if (hasValue(payload.dealPrice) || hasValue(payload.deal_price) || hasValue(payload.discounted_price)) {
    update.discounted_price = moneyNumeric(payload.dealPrice ?? payload.deal_price ?? payload.discounted_price);
  }
  if (hasValue(payload.discountPercent) || hasValue(payload.discount_percent)) {
    update.discount_percentage = moneyNumeric(payload.discountPercent ?? payload.discount_percent);
  }
  if (hasValue(payload.priceRangeMin) || hasValue(payload.price_range_min)) {
    const value = nullableNumeric(payload.priceRangeMin ?? payload.price_range_min);
    update.price_range_min = value;
    update.price_min = value;
  }
  if (hasValue(payload.priceRangeMax) || hasValue(payload.price_range_max)) {
    const value = nullableNumeric(payload.priceRangeMax ?? payload.price_range_max);
    update.price_range_max = value;
    update.price_max = value;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "isValid") || Object.prototype.hasOwnProperty.call(payload, "is_valid")) {
    update.is_valid = Boolean(payload.isValid ?? payload.is_valid);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "isExpired") || Object.prototype.hasOwnProperty.call(payload, "is_expired")) {
    update.is_expired = Boolean(payload.isExpired ?? payload.is_expired);
  }
  if (hasValue(payload.status)) {
    update.status = normalizeAdminStatus(payload.status);
  }
  if (Array.isArray(payload.validationFlags) || Array.isArray(payload.validation_flags)) {
    update.validation_flags = payload.validationFlags || payload.validation_flags;
  }
  if (hasValue(payload.storeName) || hasValue(payload.store_name)) {
    update.store_id = await ensureStoreByName(payload.storeName ?? payload.store_name);
  }
  if (hasValue(payload.categoryName) || hasValue(payload.category_name)) {
    update.category_id = await ensureCategoryByName(payload.categoryName ?? payload.category_name);
  }

  return update;
}

function finalizeAdminDealUpdate(current, update, payload = {}) {
  const merged = { ...current, ...update };
  const finalUpdate = {
    ...update,
    updated_at: new Date().toISOString()
  };

  if (!merged.category_id) {
    finalUpdate.category_id = merged.category_id;
  }

  const dealPrice = numberOrNull(merged.discounted_price);
  const originalPrice = numberOrNull(merged.original_price);
  if (originalPrice && dealPrice && originalPrice >= dealPrice) {
    finalUpdate.discount_percentage = Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
  } else if (!Object.prototype.hasOwnProperty.call(finalUpdate, "discount_percentage")) {
    finalUpdate.discount_percentage = 0;
  }

  const allowMissingImage = Boolean(payload.allowMissingImage || payload.allow_missing_image);
  const flags = buildValidationFlags(merged, { allowMissingImage });
  finalUpdate.validation_flags = flags;

  const explicitStatus = Object.prototype.hasOwnProperty.call(update, "status");
  const approving = update.status === "approved" || update.status === "active";
  if (flags.length > 0 && !approving) {
    finalUpdate.status = explicitStatus ? update.status : "pending_review";
    finalUpdate.is_valid = false;
    finalUpdate.is_verified = false;
    finalUpdate.admin_review_status = "needs_review";
  } else if (approving) {
    finalUpdate.status = update.status;
    finalUpdate.is_valid = true;
    finalUpdate.is_verified = true;
    finalUpdate.admin_review_status = "approved";
  }

  if (finalUpdate.is_expired === true && !explicitStatus) {
    finalUpdate.status = "expired";
  }

  return finalUpdate;
}

function validateAdminDealUpdate(merged, payload = {}) {
  const dealPrice = numberOrNull(merged.discounted_price);
  const originalPrice = numberOrNull(merged.original_price);
  const rangeMin = numberOrNull(merged.price_range_min ?? merged.price_min);
  const rangeMax = numberOrNull(merged.price_range_max ?? merged.price_max);
  const hasPriceRange = Number(rangeMin || 0) > 0 || Number(rangeMax || 0) > 0;
  const status = normalizeAdminStatus(payload.status || merged.status);
  const approved = ["approved", "active"].includes(status) || payload.isValid === true || payload.is_valid === true;

  if (dealPrice !== null && dealPrice < 0) {
    const error = new Error("dealPrice must be a valid non-negative number.");
    error.statusCode = 400;
    throw error;
  }
  if (originalPrice !== null && originalPrice < 0) {
    const error = new Error("originalPrice must be a valid non-negative number.");
    error.statusCode = 400;
    throw error;
  }
  if (rangeMin !== null && rangeMax !== null && rangeMin > 0 && rangeMax > 0 && rangeMin > rangeMax) {
    const error = new Error("priceRangeMin must be less than or equal to priceRangeMax.");
    error.statusCode = 400;
    throw error;
  }
  if (originalPrice && dealPrice && dealPrice > originalPrice) {
    const error = new Error("originalPrice must be greater than or equal to dealPrice.");
    error.statusCode = 400;
    throw error;
  }
  if (approved && !(dealPrice && dealPrice > 0) && !hasPriceRange) {
    const error = new Error("dealPrice must be greater than 0 unless a valid price range is set.");
    error.statusCode = 400;
    throw error;
  }
  if (approved && !payload.allowMissingImage && !payload.allow_missing_image && !dealImageUrl(merged)) {
    const error = new Error("imageUrl is required before approving unless allowMissingImage is true.");
    error.statusCode = 400;
    throw error;
  }
}

function toFlaggedDeal(row, imageStatus) {
  const flags = buildValidationFlags(row, { imageBroken: imageStatus === "broken" });
  return {
    id: row.id,
    title: row.title || "",
    slug: row.slug || row.id,
    storeName: row.stores?.name || row.store_name || "",
    imageUrl: dealImageUrl(row) || null,
    dealPrice: numberOrNull(row.discounted_price),
    originalPrice: numberOrNull(row.original_price),
    priceRangeMin: numberOrNull(row.price_range_min ?? row.price_min),
    priceRangeMax: numberOrNull(row.price_range_max ?? row.price_max),
    categoryName: row.categories?.name || row.category_name || "",
    productUrl: dealProductUrl(row) || "",
    couponCode: row.coupon_code || "",
    flags,
    status: row.status || "approved",
    sourceType: row.source_type || row.raw_source_payload?.connectorMode || "",
    adminNotes: row.admin_notes || "",
    validationFlags: arrayFromJson(row.validation_flags),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function buildValidationFlags(row, options = {}) {
  const flags = [];
  const existingManualFlags = arrayFromJson(row.validation_flags).filter((flag) => !AUTO_FLAGS.has(flag));
  const imageUrl = dealImageUrl(row);
  const dealPrice = numberOrNull(row.discounted_price);
  const originalPrice = numberOrNull(row.original_price);
  const rangeMin = numberOrNull(row.price_range_min ?? row.price_min);
  const rangeMax = numberOrNull(row.price_range_max ?? row.price_max);
  const hasPriceRange = Number(rangeMin || 0) > 0 || Number(rangeMax || 0) > 0;

  if (!imageUrl && !options.allowMissingImage) flags.push("missing_image");
  if (options.imageBroken) flags.push("broken_image");
  if (dealPrice === null && !hasPriceRange) flags.push("missing_price");
  if (dealPrice === 0 && !hasPriceRange) flags.push("zero_price");
  if ((dealPrice !== null && dealPrice < 0) || (originalPrice !== null && originalPrice < 0)) flags.push("invalid_price");
  if (originalPrice !== null && originalPrice <= 0 && row.original_price !== null && row.original_price !== undefined && row.original_price !== "") {
    flags.push("invalid_original_price");
  }
  if (originalPrice && dealPrice && dealPrice > originalPrice) flags.push("price_mismatch");
  if (!row.category_id && !row.categories?.name && !row.category_name) flags.push("missing_category");
  if (!clean(row.title)) flags.push("missing_title");
  if (!dealProductUrl(row)) flags.push("missing_product_url");
  if (row.is_valid === false) flags.push("invalid_deal");
  if (row.status === "pending_review" || row.admin_review_status === "needs_review") flags.push("pending_review");
  if (isTelegramDeal(row) && (flags.length > 0 || arrayFromJson(row.validation_flags).length > 0)) {
    flags.push("suspicious_telegram");
  }

  return [...new Set([...flags, ...existingManualFlags])];
}

async function getAdminSummary(flaggedItems) {
  const [totalDeals, legacyActiveDeals, approvedDeals, pendingReview, rejectedDeals, telegramDeals] = await Promise.all([
    countDeals(),
    countDeals((query) => query.eq("status", "active")),
    countDeals((query) => query.eq("status", "approved")),
    countDeals((query) => query.eq("status", "pending_review")),
    countDeals((query) => query.eq("status", "rejected")),
    countDeals((query) => query.not("telegram_channel", "is", null))
  ]);

  return {
    totalDeals,
    activeDeals: legacyActiveDeals + approvedDeals,
    flaggedDeals: flaggedItems.length,
    missingImage: flaggedItems.filter((item) => item.flags.includes("missing_image") || item.flags.includes("broken_image")).length,
    zeroPrice: flaggedItems.filter((item) => item.flags.includes("zero_price") || item.flags.includes("missing_price") || item.flags.includes("invalid_price")).length,
    pendingReview,
    approvedDeals,
    rejectedDeals,
    telegramDeals: Math.max(telegramDeals, flaggedItems.filter((item) => String(item.sourceType || "").includes("telegram")).length)
  };
}

async function countDeals(applyFilter = (query) => query) {
  const query = applyFilter(supabaseAdmin.from("deals").select("id", { count: "exact", head: true }));
  const { count, error } = await query;
  if (error) return 0;
  return Number(count || 0);
}

function filterFlaggedItems(items, filters = {}) {
  const section = String(filters.section || filters.view || "all").toLowerCase();
  const flag = String(filters.flag || "").toLowerCase();
  const status = String(filters.status || "").toLowerCase();
  return items.filter((item) => {
    if (flag && !item.flags.includes(flag)) return false;
    if (status && String(item.status || "").toLowerCase() !== status) return false;
    if (section === "telegram") return item.sourceType.includes("telegram");
    if (section === "missing_image") return item.flags.includes("missing_image") || item.flags.includes("broken_image");
    if (section === "zero_price") return item.flags.includes("zero_price") || item.flags.includes("missing_price");
    if (section === "price_mismatch") return item.flags.includes("price_mismatch");
    if (section === "pending") return item.status === "pending_review";
    if (section === "approved") return item.status === "approved" || item.status === "active";
    if (section === "rejected") return item.status === "rejected";
    return true;
  });
}

async function checkImageStatuses(rows) {
  const targets = (rows || [])
    .filter((row) => dealImageUrl(row))
    .slice(0, 30);
  const results = await Promise.all(targets.map(async (row) => {
    const status = await isBrokenImageUrl(dealImageUrl(row)) ? "broken" : "ok";
    return [row.id, status];
  }));
  return new Map(results);
}

async function isBrokenImageUrl(url) {
  if (!/^https?:\/\//i.test(String(url || ""))) return true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    let response = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow" });
    }
    return !response.ok;
  } catch {
    return true;
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureStoreByName(value) {
  const name = clean(value) || "Store";
  const { data, error } = await supabaseAdmin
    .from("stores")
    .upsert({
      name,
      slug: slugify(name),
      website_url: "",
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();
  throwIfSupabaseError(error, "stores");
  return data?.id || null;
}

async function ensureCategoryByName(value) {
  const name = clean(value) || "Other Deals";
  const { data, error } = await supabaseAdmin
    .from("categories")
    .upsert({
      name,
      slug: slugify(name),
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();
  throwIfSupabaseError(error, "categories");
  return data?.id || null;
}

function dealImageUrl(row) {
  return [row.image_url, row.final_image_url, row.source_image_url, row.raw_source_payload?.final_image_url, row.raw_source_payload?.imageUrl]
    .map(clean)
    .find((value) => /^https?:\/\//i.test(value)) || "";
}

function dealProductUrl(row) {
  return [row.affiliate_link, row.product_url, row.source_url, row.platform_product_url, row.raw_source_payload?.product_url, row.raw_source_payload?.sourceUrl]
    .map(clean)
    .find((value) => /^https?:\/\//i.test(value)) || "";
}

function isTelegramDeal(row) {
  return String(row.source_type || "").includes("telegram") ||
    String(row.telegram_channel || row.source_channel || "").trim() !== "" ||
    String(row.raw_source_payload?.connectorMode || "").includes("telegram");
}

function arrayFromJson(value) {
  if (Array.isArray(value)) return value.map(String);
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function appendNote(existing, note) {
  const next = clean(note);
  if (!next) return existing || "";
  return [existing, next].filter(Boolean).join("\n");
}

function adminIdentity(adminUser = {}) {
  return clean(adminUser.email || adminUser.id || "admin");
}

function normalizeAdminStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return status || "approved";
}

function assignText(target, key, value) {
  if (hasValue(value)) target[key] = clean(value);
}

function nullableNumeric(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    const error = new Error("Price fields must be valid numbers.");
    error.statusCode = 400;
    throw error;
  }
  return numeric;
}

function moneyNumeric(value) {
  if (value === "" || value === null || value === undefined) return 0;
  return nullableNumeric(value);
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function hasPositivePrice(row) {
  const price = numberOrNull(row.discounted_price);
  return Boolean(price && price > 0);
}

function hasPriceRange(row) {
  const rangeMin = numberOrNull(row.price_range_min ?? row.price_min);
  const rangeMax = numberOrNull(row.price_range_max ?? row.price_max);
  return Number(rangeMin || 0) > 0 || Number(rangeMax || 0) > 0;
}

function calculateDiscount(originalPrice, dealPrice) {
  if (!originalPrice || !dealPrice || originalPrice <= 0 || dealPrice < 0 || dealPrice > originalPrice) return 0;
  return Math.max(0, Math.min(100, Math.round(((originalPrice - dealPrice) / originalPrice) * 100)));
}

function truncateClean(value, maxLength) {
  const text = clean(value).replace(/\s+/g, " ");
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength + 1);
  return truncated.slice(0, truncated.lastIndexOf(" ")).trim() || text.slice(0, maxLength).trim();
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasValue(value) {
  return value !== undefined;
}

function clean(value) {
  return String(value || "").trim();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "other-deals";
}

const AUTO_FLAGS = new Set([
  "missing_image",
  "broken_image",
  "missing_price",
  "zero_price",
  "invalid_price",
  "invalid_original_price",
  "price_mismatch",
  "missing_category",
  "missing_title",
  "missing_product_url",
  "invalid_deal",
  "pending_review",
  "suspicious_telegram"
]);

module.exports = {
  approveAdminDeal,
  approveScrapedDeal,
  flagAdminDeal,
  listFlaggedDeals,
  listScrapeLogs,
  listScrapedDeals,
  listTelegramDeals,
  rejectScrapedDeal,
  rejectAdminDeal,
  markTelegramDealExpired,
  updateAdminDeal,
  updateManualExpiry,
  updateManualPrice
};
