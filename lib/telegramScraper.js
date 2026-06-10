const { supabaseAdmin } = require("../src/config/supabaseClient");
const priceComparisonRepository = require("../src/repositories/priceComparisonRepository");
const { parseDealText, validateDeal } = require("./dealParser");
const { getPlatformLogo } = require("./platformLogos");

const DEFAULT_CHANNELS = ["king_deal_1", "icoolzTricks"];
const DEFAULT_LIMIT = 50;

async function scrapeTelegramDeals(options = {}) {
  assertTelegramEnvironment();
  const channels = normalizeChannels(options.channels);
  const limit = Math.min(100, Math.max(1, Number(options.limit || DEFAULT_LIMIT)));
  const summary = {
    success: true,
    message: "Telegram scraping completed",
    channels,
    total_messages_checked: 0,
    valid_deals_saved: 0,
    duplicates_skipped: 0,
    rejected: 0,
    updated: 0,
    category_summary: {},
    errors: []
  };

  for (const channel of channels) {
    try {
      console.log(`[telegram-scraper] Channel started: ${channel}`);
      const messages = await fetchChannelMessages(channel, limit);
      summary.total_messages_checked += messages.length;

      for (const message of messages) {
        const result = await processTelegramMessage(channel, message).catch((error) => ({
          status: "failed",
          reason: error instanceof Error ? error.message : "Message processing failed"
        }));

        if (result.status === "inserted") summary.valid_deals_saved += 1;
        if (result.status === "updated") summary.updated += 1;
        if ((result.status === "inserted" || result.status === "updated") && result.category) {
          summary.category_summary[result.category] = (summary.category_summary[result.category] || 0) + 1;
        }
        if (result.status === "duplicate") summary.duplicates_skipped += 1;
        if (result.status === "rejected") summary.rejected += 1;
        if (result.status === "failed") {
          summary.rejected += 1;
          summary.errors.push({ channel, messageId: message.telegram_message_id, error: result.reason });
        }
      }
    } catch (error) {
      summary.errors.push({
        channel,
        error: error instanceof Error ? error.message : "Channel scrape failed"
      });
    }
  }

  return summary;
}

function getTelegramScraperStatus() {
  const channels = normalizeChannels();
  const missingEnv = requiredRuntimeEnv().filter((key) => !process.env[key]);
  return {
    success: true,
    service: "Telegram scraper",
    channels,
    status: missingEnv.length ? "missing_env" : "ready",
    missingEnv,
    mode: "public-channel-preview",
    message: missingEnv.length
      ? `Add missing environment variables: ${missingEnv.join(", ")}`
      : "Telegram scraper is ready."
  };
}

async function fetchChannelMessages(channel, limit) {
  const url = `https://t.me/s/${encodeURIComponent(channel)}`;
  try {
    const html = await fetchText(url);
    return parseTelegramPreviewMessages(html, channel).slice(0, limit);
  } catch (error) {
    const reason = error?.cause?.code || error?.message || "direct fetch failed";
    console.log(`[telegram-scraper] Direct Telegram fetch failed for ${channel}: ${reason}. Trying reader fallback.`);
    const markdown = await fetchText(readerUrl(url));
    return parseTelegramReaderMessages(markdown, channel).slice(0, limit);
  }
}

async function processTelegramMessage(channel, message) {
  console.log(`[telegram-scraper] Message checked: ${channel}/${message.telegram_message_id}`);
  const parsed = await parseDealText({
    message: message.message_text,
    productUrl: message.product_url,
    imageUrl: message.image_url,
    sourceChannel: channel,
    telegramMessageId: message.telegram_message_id
  });
  const rejectReason = rejectMessageReason(message, parsed);
  if (rejectReason) {
    console.log(`[telegram-scraper] Deal rejected: ${channel}/${message.telegram_message_id} - ${rejectReason}`);
    return { status: "rejected", reason: rejectReason };
  }

  const fallbackImageUrl = getPlatformLogo(parsed.platform);
  const uploadedTelegramImage = parsed.imageUrl
    ? await uploadTelegramImage(parsed.imageUrl, channel, message.telegram_message_id).catch((error) => {
      console.log(`[telegram-scraper] Image download/upload failed: ${channel}/${message.telegram_message_id} - ${error.message}`);
      return "";
    })
    : "";
  const finalImageUrl = uploadedTelegramImage || validHttpUrl(parsed.imageUrl) || fallbackImageUrl;
  const sourceImageUrl = uploadedTelegramImage || validHttpUrl(parsed.imageUrl) || "";

  console.log(`[telegram-scraper] Platform detected: ${parsed.platform}`);
  console.log(`[telegram-scraper] Deal accepted: category ${parsed.category}`);
  if (!sourceImageUrl) console.log(`[telegram-scraper] Fallback logo used: ${parsed.platform}`);

  const existing = await findDuplicateDeal(channel, message.telegram_message_id, parsed);
  if (existing && Number(existing.discounted_price) === Number(parsed.dealPrice) && !shouldRefreshExistingDeal(existing, parsed)) {
    console.log(`[telegram-scraper] Duplicate skipped: ${channel}/${message.telegram_message_id}`);
    return { status: "duplicate", dealId: existing.id, category: parsed.category };
  }

  const action = existing ? "updated" : "inserted";
  const dealId = await upsertParsedDeal({
    existing,
    channel,
    message,
    parsed,
    finalImageUrl,
    fallbackImageUrl,
    sourceImageUrl
  });
  await saveSinglePlatformComparison(dealId, parsed, finalImageUrl).catch((error) => {
    console.log(`[telegram-scraper] Price comparison save skipped: ${channel}/${message.telegram_message_id} - ${error.message}`);
  });

  console.log(`[telegram-scraper] Supabase ${action} success: ${dealId}`);
  return { status: action, dealId, category: parsed.category };
}

async function saveSinglePlatformComparison(dealId, parsed) {
  if (!dealId || !parsed?.platform || !parsed?.productUrl || !parsed?.dealPrice) return;
  await priceComparisonRepository.savePriceComparison(dealId, [
    {
      platform: parsed.platform,
      platform_logo_url: getPlatformLogo(parsed.platform),
      product_url: parsed.productUrl,
      price: parsed.dealPrice,
      original_price: parsed.originalPrice || parsed.dealPrice,
      discount_percent: parsed.discountPercent || 0,
      coupon_code: parsed.couponCode || null,
      delivery_charge: 0,
      rating: null,
      review_count: 0,
      is_available: true
    }
  ]);
}

function rejectMessageReason(message, parsed) {
  if (isPromotionOnly(message.message_text)) return "Promotion/non-shopping message";
  return validateDeal(parsed);
}

async function upsertParsedDeal({ existing, channel, message, parsed, finalImageUrl, fallbackImageUrl, sourceImageUrl }) {
  const now = new Date().toISOString();
  const storeId = await ensureStore(parsed.platform);
  const categoryId = await ensureCategory(parsed.category);
  const payload = {
    title: parsed.productTitle,
    slug: `${slugify(parsed.productTitle)}-${hashString(parsed.dedupeKey).slice(0, 8)}`,
    description: truncateClean(message.message_text, 260),
    store_id: storeId,
    category_id: categoryId,
    original_price: parsed.originalPrice || parsed.dealPrice,
    discounted_price: parsed.dealPrice,
    discount_percentage: parsed.discountPercent || 0,
    coupon_code: parsed.couponCode || "",
    cashback_percentage: 0,
    affiliate_link: parsed.productUrl,
    image_url: finalImageUrl,
    source_image_url: sourceImageUrl,
    fallback_image_url: fallbackImageUrl,
    final_image_url: finalImageUrl,
    platform_product_url: parsed.productUrl,
    deal_score: parsed.dealScore,
    is_hot_deal: Boolean(parsed.isHotDeal),
    is_super_hot_deal: Boolean(parsed.isSuperHotDeal),
    is_best_price: Boolean(parsed.isBestPrice),
    is_coupon_deal: Boolean(parsed.isCouponDeal || parsed.couponCode),
    is_free_deal: Boolean(parsed.isFreeDeal || parsed.hasFreeSignal),
    telegram_channel: channel,
    telegram_message_id: String(message.telegram_message_id),
    message_text: message.message_text,
    expiry_date: null,
    platform_expires_at: null,
    status: "active",
    is_featured: Boolean(parsed.isHotDeal || parsed.isSuperHotDeal),
    is_verified: true,
    updated_at: now,
    fetched_at: now,
    source_updated_at: message.created_at || now,
    source: parsed.isFreeDeal || parsed.hasFreeSignal ? "FREE" : parsed.couponCode ? "COUPON" : "DISCOUNT",
    source_product_id: `${channel}:${message.telegram_message_id}`,
    source_url: parsed.productUrl,
    dedupe_key: parsed.dedupeKey,
    last_scraped_at: now,
    raw_source_payload: {
      connectorMode: "telegram-channel",
      telegram_channel: channel,
      telegram_message_id: String(message.telegram_message_id),
      message_text: message.message_text,
      product_title: parsed.productTitle,
      original_price: parsed.originalPrice || null,
      deal_price: parsed.dealPrice,
      discount_percent: parsed.discountPercent || null,
      coupon_code: parsed.couponCode || "",
      product_url: parsed.productUrl,
      platform: parsed.platform,
      category: parsed.category,
      image_url: sourceImageUrl,
      fallback_image_url: fallbackImageUrl,
      final_image_url: finalImageUrl,
      deal_score: parsed.dealScore,
      is_hot_deal: parsed.isHotDeal,
      is_super_hot_deal: parsed.isSuperHotDeal,
      is_best_price: parsed.isBestPrice,
      is_coupon_deal: Boolean(parsed.isCouponDeal || parsed.couponCode),
      is_free_deal: Boolean(parsed.isFreeDeal || parsed.hasFreeSignal),
      created_at: message.created_at,
      expires_at: null,
      is_active: true
    }
  };

  if (existing?.id) {
    const shouldUpdateImage = sourceImageUrl || !existing.image_url;
    const updatePayload = {
      ...payload,
      image_url: shouldUpdateImage ? finalImageUrl : existing.image_url,
      source_image_url: shouldUpdateImage ? sourceImageUrl : existing.source_image_url
    };
    const { data, error } = await supabaseAdmin
      .from("deals")
      .update(updatePayload)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error && isMissingOptionalColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from("deals")
        .update(stripOptionalDealColumns(updatePayload))
        .eq("id", existing.id)
        .select("id")
        .single();
      if (fallbackError) throw new Error(`Supabase update failed: ${fallbackError.message}`);
      return fallbackData.id;
    }
    if (error) throw new Error(`Supabase update failed: ${error.message}`);
    return data.id;
  }

  const { data, error } = await supabaseAdmin
    .from("deals")
    .insert({ ...payload, created_at: now })
    .select("id")
    .single();
  if (error && isMissingOptionalColumnError(error)) {
    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
      .from("deals")
      .insert({ ...stripOptionalDealColumns(payload), created_at: now })
      .select("id")
      .single();
    if (fallbackError) throw new Error(`Supabase insert failed: ${fallbackError.message}`);
    return fallbackData.id;
  }
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data.id;
}

function stripOptionalDealColumns(payload) {
  const copy = { ...payload };
  [
    "fallback_image_url",
    "final_image_url",
    "source_image_url",
    "platform_product_url",
    "fetched_at",
    "source_updated_at",
    "platform_expires_at",
    "deal_score",
    "is_hot_deal",
    "is_super_hot_deal",
    "is_best_price",
    "is_coupon_deal",
    "is_free_deal",
    "telegram_channel",
    "telegram_message_id",
    "message_text"
  ].forEach((key) => {
    delete copy[key];
  });
  return copy;
}

function isMissingOptionalColumnError(error) {
  return /column .* does not exist|could not find .* column|schema cache/i.test(error?.message || "");
}

async function findDuplicateDeal(channel, messageId, parsed) {
  const sourceProductId = `${channel}:${messageId}`;
  const bySource = await maybeSingle("source_product_id", sourceProductId);
  if (bySource) return bySource;
  const byDedupe = await maybeSingle("dedupe_key", parsed.dedupeKey);
  if (byDedupe) return byDedupe;
  const byUrl = await maybeSingle("source_url", parsed.productUrl);
  if (byUrl) return byUrl;
  return null;
}

async function maybeSingle(column, value) {
  if (!value) return null;
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("id,title,discounted_price,image_url")
    .eq(column, value)
    .maybeSingle();
  if (error) throw new Error(`Duplicate lookup failed: ${error.message}`);
  return data || null;
}

function shouldRefreshExistingDeal(existing, parsed) {
  const currentTitle = String(existing?.title || "");
  return isWeakTelegramTitle(currentTitle) && !isWeakTelegramTitle(parsed.productTitle);
}

function isWeakTelegramTitle(value) {
  return /^(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\s+\d+(?:\.\d+)?$/i.test(String(value || "").trim()) ||
    /^\d+(?:\.\d+)?$/.test(String(value || "").trim());
}

async function ensureStore(platform) {
  const name = platform || "Unknown";
  const { data, error } = await supabaseAdmin
    .from("stores")
    .upsert({
      name,
      slug: slugify(name),
      website_url: "",
      logo_url: getPlatformLogo(name),
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw new Error(`Store upsert failed: ${error.message}`);
  return data?.id || null;
}

async function ensureCategory(category) {
  const name = category || "Other Deals";
  const { data, error } = await supabaseAdmin
    .from("categories")
    .upsert({
      name,
      slug: slugify(name),
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw new Error(`Category upsert failed: ${error.message}`);
  return data?.id || null;
}

async function uploadTelegramImage(imageUrl, channel, messageId) {
  if (!validHttpUrl(imageUrl)) return "";
  const bucket = process.env.SUPABASE_DEAL_IMAGES_BUCKET || "deal-images";
  await ensureStorageBucket(bucket).catch(() => {});
  const response = await fetchWithTimeout(imageUrl, { headers: { accept: "image/*,*/*" } }, Number(process.env.TELEGRAM_IMAGE_FETCH_TIMEOUT_MS || 8000));
  if (!response.ok) throw new Error(`Image fetch HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error(`Image URL did not return an image: ${contentType}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const extension = extensionForContentType(contentType);
  const path = `telegram/${slugify(channel)}/${messageId}-${Date.now()}.${extension}`;
  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: true
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || "";
}

async function ensureStorageBucket(bucket) {
  const { error } = await supabaseAdmin.storage.createBucket(bucket, { public: true });
  if (error && !/already exists/i.test(error.message || "")) throw error;
}

async function fetchText(url) {
  let response;
  try {
    response = await fetchWithTimeout(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-IN,en;q=0.9",
        "user-agent": "EnjoyFreeDealsBot/1.0 (+https://enjoyfreedeals.vercel.app; public Telegram deal indexing)"
      }
    }, Number(process.env.TELEGRAM_PAGE_FETCH_TIMEOUT_MS || 15000));
  } catch (error) {
    const reason = error?.cause?.code || error?.message || "network error";
    throw new Error(`Telegram page fetch failed for ${url}: ${reason}`);
  }
  if (!response.ok) throw new Error(`Telegram page fetch failed with HTTP ${response.status}`);
  return response.text();
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timeout);
  }
}

function parseTelegramPreviewMessages(html, channel) {
  return String(html || "")
    .split(/(?=<div class="tgme_widget_message\b)/g)
    .filter((block) => block.includes("data-post="))
    .map((block) => parseMessageBlock(block, channel))
    .filter(Boolean);
}

function parseTelegramReaderMessages(markdown, channel) {
  const value = String(markdown || "");
  const postPattern = new RegExp(`(?:\\d+[KkMm]?\\s+)?views\\[[^\\]]+\\]\\(https://t\\.me/${escapeRegExp(channel)}/(\\d+)\\)`, "gi");
  const matches = [...value.matchAll(postPattern)];
  const messages = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const messageId = match[1];
    const start = index === 0 ? 0 : (matches[index - 1].index || 0) + matches[index - 1][0].length;
    const end = match.index || value.length;
    const block = value.slice(start, end);
    const text = markdownToText(block);
    const urls = markdownUrls(block).filter((url) => validHttpUrl(url) && !isTelegramChromeUrl(url) && !isImageUrl(url));
    const imageUrl = markdownImages(block).find(validHttpUrl) || "";
    if (!text && urls.length === 0) continue;

    messages.push({
      telegram_channel: channel,
      telegram_message_id: String(messageId),
      message_text: [text, ...urls].filter(Boolean).join("\n"),
      product_url: urls[0] || "",
      image_url: imageUrl,
      created_at: new Date().toISOString()
    });
  }

  return messages;
}

function readerUrl(url) {
  return `https://r.jina.ai/http://r.jina.ai/http://${url}`;
}

function parseMessageBlock(block, expectedChannel) {
  const dataPost = decodeHtml(attributeValue(block, "data-post"));
  const [channel, messageIdValue] = dataPost.split("/");
  const messageId = Number(messageIdValue);
  if (!channel || channel.toLowerCase() !== expectedChannel.toLowerCase() || !Number.isFinite(messageId)) return null;

  const textHtml = block.match(/<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
  const text = htmlToText(textHtml);
  const urls = extractHrefs(block).filter((url) => validHttpUrl(url) && !isTelegramChromeUrl(url) && !isImageUrl(url));
  const imageUrl = extractTelegramImage(block);
  const dateTime = block.match(/<time[^>]+datetime="([^"]+)"/i)?.[1] || "";

  return {
    telegram_channel: channel,
    telegram_message_id: String(messageId),
    message_text: [text, ...urls].filter(Boolean).join("\n"),
    product_url: urls[0] || "",
    image_url: imageUrl,
    created_at: dateTime || new Date().toISOString()
  };
}

function extractTelegramImage(block) {
  const styleUrl = block.match(/background-image:url\(['"]?([^'")]+)['"]?\)/i)?.[1] || "";
  const imgSrc = block.match(/<img[^>]+src="([^"]+)"/i)?.[1] || "";
  const imageUrl = absoluteHttpUrl(decodeHtml(styleUrl || imgSrc));
  return /telegram\.org\/img\/emoji/i.test(imageUrl) ? "" : imageUrl;
}

function extractHrefs(html) {
  return [...String(html || "").matchAll(/href="([^"]+)"/gi)]
    .map((match) => stripTrailingPunctuation(decodeHtml(match[1])))
    .map(absoluteHttpUrl);
}

function markdownUrls(block) {
  const urls = new Set();
  for (const match of String(block || "").matchAll(/\[[^\]]*]\((https?:\/\/[^)]+)\)/gi)) {
    urls.add(stripTrailingPunctuation(decodeMarkdownUrl(match[1])));
  }
  for (const match of String(block || "").matchAll(/https?:\/\/[^\s)>\]]+/gi)) {
    urls.add(stripTrailingPunctuation(decodeMarkdownUrl(match[0])));
  }
  return [...urls].map(absoluteHttpUrl);
}

function markdownImages(block) {
  return [...String(block || "").matchAll(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/gi)]
    .map((match) => stripTrailingPunctuation(decodeMarkdownUrl(match[1])))
    .map(absoluteHttpUrl);
}

function markdownToText(block) {
  return decodeMarkdownUrl(String(block || ""))
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*]\(https?:\/\/t\.me\/[^)]+\)/gi, " ")
    .replace(/\[([^\]]+)]\((https?:\/\/[^)]+)\)/g, "$1 $2")
    .replace(/^#+\s*/gm, "")
    .replace(/[_*`]/g, "")
    .replace(/\b\d+[KkMm]?\s+views\b.*$/gim, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeChannels(channels) {
  const configured = (Array.isArray(channels) ? channels : String(channels || process.env.SUPPORTED_TELEGRAM_CHANNELS || "").split(","))
    .map((channel) => String(channel || "").trim().replace(/^@/, ""))
    .filter(Boolean);
  return [...new Set(configured.length ? configured : DEFAULT_CHANNELS)];
}

function assertTelegramEnvironment() {
  const missing = requiredRuntimeEnv().filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Missing required environment variables: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

function requiredRuntimeEnv() {
  return ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
}

function isPromotionOnly(text) {
  const value = String(text || "").toLowerCase();
  return /\b(join|subscribe|follow|channel|telegram)\b/.test(value) &&
    !/\b(deal|offer|coupon|price|mrp|off|sale|loot)\b/.test(value);
}

function extensionForContentType(contentType) {
  if (/png/i.test(contentType)) return "png";
  if (/webp/i.test(contentType)) return "webp";
  if (/gif/i.test(contentType)) return "gif";
  return "jpg";
}

function isTelegramChromeUrl(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return host === "t.me" || host === "telegram.me" || host === "telegram.org";
  } catch {
    return false;
  }
}

function isImageUrl(value) {
  try {
    const parsed = new URL(value);
    return /\.(?:avif|gif|jpe?g|png|webp|svg)(?:$|[?#])/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function validHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function attributeValue(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return String(html || "").match(new RegExp(`${escaped}="([^"]*)"`, "i"))?.[1] || "";
}

function htmlToText(html) {
  return decodeHtml(
    String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
  ).trim();
}

function absoluteHttpUrl(value) {
  if (String(value || "").startsWith("//")) return `https:${value}`;
  return String(value || "");
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

function decodeMarkdownUrl(value) {
  return decodeHtml(String(value || "").replace(/\\([_()[\].])/g, "$1"));
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripTrailingPunctuation(value) {
  return String(value || "").replace(/[),.]+$/g, "");
}

function truncateClean(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length <= maxLength ? text : text.slice(0, maxLength).trim();
}

function slugify(value) {
  return String(value || "deal")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "deal";
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < String(value || "").length; index += 1) {
    hash ^= String(value).charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

module.exports = { getTelegramScraperStatus, scrapeTelegramDeals };
