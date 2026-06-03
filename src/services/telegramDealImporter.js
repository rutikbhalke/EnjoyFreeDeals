const { supabaseAdmin } = require("../config/supabaseClient");
const { throwIfSupabaseError } = require("../utils/supabaseErrors");

const SOURCE_KEY = "telegram_enjoyfreedeals";
const SOURCE_NAME = "EnjoyFreeDeals Telegram";
const SOURCE_URL = "https://t.me/+X925uAMEGvgwOWY1";
const GENIE_LOOT_PAGE_SOURCE_KEY = "genie_loot_page";
const GENIE_LOOT_PAGE_SOURCE_NAME = "Genie Loot Page";
const DEFAULT_GENIE_LOOT_PAGE_URL = "https://t.me/s/India_loot_deals";
const DEFAULT_GENIE_LOOT_PAGE_URLS = [
  "https://t.me/s/India_loot_deals",
  "https://t.me/s/king_deal_1",
  "https://t.me/s/icoolzTricks"
];
const DEFAULT_BEST_DEAL_FRACTION = 1 / 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_DEAL_IMAGES = {
  electronics: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80",
  mobile: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  fashion: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
  shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  home: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=900&q=80",
  grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
  general: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80"
};

async function importTelegramDeals() {
  const token = telegramBotToken();
  const source = await ensureTelegramSource();
  const job = await startJob(source);
  const counts = { imported: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    await deleteWebhook(token);
    const updates = await fetchUpdates(token);
    const deals = telegramUpdatesToDeals(updates, source);

    for (const deal of deals) {
      try {
        const result = await upsertDeal(deal);
        await recordScrapedItem(job.id, source, deal, result.action, "", result.dealId);
        counts[result.action] += 1;
      } catch (error) {
        counts.failed += 1;
        await recordFailedItem(job.id, source, deal, error);
      }
    }

    counts.skipped = Math.max(0, updates.length - deals.length);
    await acknowledgeUpdates(token, updates);
    await finishJob(job.id, source, counts, "success", "");

    return {
      sourceKey: source.source_key,
      updateCount: updates.length,
      dealCount: deals.length,
      message: importResultMessage(updates.length, deals.length),
      ...counts
    };
  } catch (error) {
    await finishJob(job.id, source, counts, "failed", error.message || "Telegram import failed.");
    throw error;
  }
}

async function getTelegramStatus() {
  const token = telegramBotToken();
  const [bot, webhook] = await Promise.all([
    telegramApi(token, "getMe", {}),
    telegramApi(token, "getWebhookInfo", {})
  ]);

  return {
    bot: {
      id: bot.result?.id,
      username: bot.result?.username,
      firstName: bot.result?.first_name,
      canJoinGroups: bot.result?.can_join_groups,
      canReadAllGroupMessages: bot.result?.can_read_all_group_messages,
      supportsInlineQueries: bot.result?.supports_inline_queries
    },
    webhook: {
      configured: Boolean(webhook.result?.url),
      pendingUpdateCount: Number(webhook.result?.pending_update_count || 0),
      lastErrorDate: webhook.result?.last_error_date || null,
      lastErrorMessage: webhook.result?.last_error_message || ""
    },
    importUrl: "http://127.0.0.1:5000/api/admin/import-telegram",
    message: "Private Telegram invite links cannot be scraped as web pages. Add the bot as a channel admin, post a new deal, then run the import URL."
  };
}

async function scrapeGenieLootPage(options = {}) {
  const pageUrls = telegramPageUrls(options);
  const pageUrl = pageUrls[0] || DEFAULT_GENIE_LOOT_PAGE_URL;
  const maxPages = Math.min(100, Math.max(1, Number(options.maxPages || process.env.GENIE_LOOT_MAX_PAGES || 25)));
  const bestFraction = bestDealFraction(options.bestFraction || process.env.GENIE_LOOT_BEST_DEAL_FRACTION);
  const source = await ensureTelegramPageSource(pageUrl);
  const job = await startJob(source);
  const counts = { imported: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    const pageResults = await Promise.all(pageUrls.map((url) => fetchTelegramPageMessagesSafely(url, maxPages)));
    const successfulPages = pageResults.filter((result) => result.status === "success");
    const failedPages = pageResults.filter((result) => result.status === "failed");
    const messages = successfulPages.flatMap((group) => group.messages);
    const allDeals = telegramPageMessagesToDeals(messages, source);
    const deals = selectBestDeals(allDeals, bestFraction);
    const selectedKeys = new Set(deals.map((deal) => deal.dedupeKey));
    const rejectedDeals = allDeals.filter((deal) => !selectedKeys.has(deal.dedupeKey));

    for (const deal of deals) {
      try {
        const result = await upsertDeal(deal);
        await recordScrapedItem(job.id, source, deal, result.action, "", result.dealId);
        counts[result.action] += 1;
      } catch (error) {
        counts.failed += 1;
        await recordFailedItem(job.id, source, deal, error);
      }
    }
    const pruned = await deactivateRejectedDeals(rejectedDeals);
    const stalePruned = await deactivateUnselectedTelegramPageDeals(selectedKeys);

    counts.skipped = Math.max(0, messages.length - deals.length);
    await finishJob(job.id, source, counts, "success", "");

    return {
      sourceKey: source.source_key,
      pageUrl,
      pageUrls,
      maxPages,
      bestFraction,
      messageCount: messages.length,
      candidateDealCount: allDeals.length,
      dealCount: deals.length,
      failedPageCount: failedPages.length,
      failedPages: failedPages.map((page) => ({ pageUrl: page.pageUrl, error: page.error })),
      pruned: pruned + stalePruned,
      currentRunPruned: pruned,
      stalePruned,
      message: telegramPageResultMessage(messages.length, deals.length, pageUrls, failedPages.length),
      ...counts
    };
  } catch (error) {
    await finishJob(job.id, source, counts, "failed", error.message || "Telegram page scrape failed.");
    throw error;
  }
}

async function ensureTelegramSource() {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("deal_sources")
    .select("*")
    .eq("source_key", SOURCE_KEY)
    .maybeSingle();

  throwIfSupabaseError(existingError, "deal_sources");
  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from("deal_sources")
    .insert({
      source_key: SOURCE_KEY,
      source_name: SOURCE_NAME,
      source_type: "telegram",
      base_url: SOURCE_URL,
      secret_name: "TELEGRAM_BOT_TOKEN",
      enabled: true,
      trust_level: 5,
      run_interval_minutes: 15
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "deal_sources");
  return data;
}

async function ensureTelegramPageSource(pageUrl) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("deal_sources")
    .select("*")
    .eq("source_key", GENIE_LOOT_PAGE_SOURCE_KEY)
    .maybeSingle();

  throwIfSupabaseError(existingError, "deal_sources");
  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from("deal_sources")
    .insert({
      source_key: GENIE_LOOT_PAGE_SOURCE_KEY,
      source_name: GENIE_LOOT_PAGE_SOURCE_NAME,
      source_type: "telegram_page",
      base_url: pageUrl,
      secret_name: "",
      enabled: true,
      trust_level: 4,
      run_interval_minutes: 60
    })
    .select("*")
    .single();

  throwIfSupabaseError(error, "deal_sources");
  return data;
}

async function startJob(source) {
  const { data, error } = await supabaseAdmin
    .from("scraper_jobs")
    .insert({
      source_name: source.source_key,
      source_type: source.source_type || "telegram",
      status: "running",
      started_at: new Date().toISOString()
    })
    .select("id")
    .single();

  throwIfSupabaseError(error, "scraper_jobs");
  return data;
}

async function finishJob(jobId, source, counts, status, errorMessage) {
  const finishedAt = new Date().toISOString();
  const { error: jobError } = await supabaseAdmin
    .from("scraper_jobs")
    .update({
      status,
      imported_count: counts.imported,
      updated_count: counts.updated,
      skipped_count: counts.skipped,
      error_message: errorMessage,
      finished_at: finishedAt
    })
    .eq("id", jobId);

  throwIfSupabaseError(jobError, "scraper_jobs");

  const { error: sourceError } = await supabaseAdmin
    .from("deal_sources")
    .update({ last_run_at: finishedAt, updated_at: finishedAt })
    .eq("id", source.id);

  throwIfSupabaseError(sourceError, "deal_sources");
}

async function fetchUpdates(token) {
  const payload = await telegramApi(token, "getUpdates", {
    allowed_updates: JSON.stringify(["message", "edited_message", "channel_post", "edited_channel_post"]),
    limit: String(Math.min(100, Math.max(1, Number(process.env.TELEGRAM_POLL_LIMIT || 100)))),
    timeout: "0"
  });

  return Array.isArray(payload.result) ? payload.result : [];
}

async function acknowledgeUpdates(token, updates) {
  const maxUpdateId = updates.reduce((max, update) => Math.max(max, Number(update.update_id || -1)), -1);
  if (maxUpdateId < 0) return;

  await telegramApi(token, "getUpdates", {
    allowed_updates: JSON.stringify(["message", "edited_message", "channel_post", "edited_channel_post"]),
    limit: "1",
    offset: String(maxUpdateId + 1),
    timeout: "0"
  });
}

async function fetchTelegramPageMessages(pageUrl, maxPages) {
  const messagesById = new Map();
  let nextUrl = pageUrl;

  for (let page = 0; page < maxPages && nextUrl; page += 1) {
    const html = await fetchText(nextUrl);
    const messages = parseTelegramPageMessages(html, pageUrl);
    for (const message of messages) {
      messagesById.set(message.sourceProductId, message);
    }

    const oldestId = messages
      .map((message) => Number(message.messageId))
      .filter(Number.isFinite)
      .sort((a, b) => a - b)[0];
    nextUrl = oldestId && messages.length > 0 ? withBeforeParam(pageUrl, oldestId) : "";
  }

  return [...messagesById.values()];
}

async function fetchTelegramPageMessagesSafely(pageUrl, maxPages) {
  try {
    return {
      status: "success",
      pageUrl,
      messages: await fetchTelegramPageMessages(pageUrl, maxPages),
      error: ""
    };
  } catch (error) {
    const directError = error instanceof Error ? error.message : "Telegram page fetch failed.";
    const readerMessages = await fetchTelegramReaderMessages(pageUrl, maxPages).catch(() => []);
    if (readerMessages.length > 0) {
      return {
        status: "success",
        pageUrl,
        messages: readerMessages,
        error: directError,
        fallback: "jina-reader"
      };
    }

    return {
      status: "failed",
      pageUrl,
      messages: [],
      error: directError
    };
  }
}

async function fetchTelegramReaderMessages(pageUrl, maxPages) {
  const messagesById = new Map();
  let nextUrl = pageUrl;

  for (let page = 0; page < maxPages && nextUrl; page += 1) {
    const markdown = await fetchText(readerUrl(nextUrl));
    const messages = parseTelegramReaderMessages(markdown, pageUrl);
    for (const message of messages) {
      messagesById.set(message.sourceProductId, message);
    }

    const oldestId = messages
      .map((message) => Number(message.messageId))
      .filter(Number.isFinite)
      .sort((a, b) => a - b)[0];
    nextUrl = oldestId && messages.length > 0 ? withBeforeParam(pageUrl, oldestId) : "";
  }

  return [...messagesById.values()];
}

function readerUrl(url) {
  return `https://r.jina.ai/http://r.jina.ai/http://${url}`;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.TELEGRAM_PAGE_FETCH_TIMEOUT_MS || 15000));

  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-IN,en;q=0.9",
        "user-agent": "EnjoyFreeDealsBot/1.0 (+https://enjoyfreedeals.app; public Telegram deal indexing)"
      },
      redirect: "follow"
    });
  } catch (error) {
    const reason = error?.cause?.code || error?.message || "network error";
    throw new Error(`Telegram page fetch failed for ${url}: ${reason}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Telegram page fetch failed for ${url} with HTTP ${response.status}`);
  }

  return response.text();
}

async function deleteWebhook(token) {
  await telegramApi(token, "deleteWebhook", { drop_pending_updates: "false" });
}

async function telegramApi(token, method, params) {
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, { headers: { accept: "application/json" } });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok !== true) {
    const description = payload.description ? `: ${payload.description}` : "";
    throw new Error(`Telegram ${method} failed with HTTP ${response.status}${description}`);
  }

  return payload;
}

function importResultMessage(updateCount, dealCount) {
  if (dealCount > 0) {
    return "Telegram deals imported. Open /api/deals to verify they are visible in the app feed.";
  }

  if (updateCount > 0) {
    return "Telegram returned updates, but none looked like deal posts with a price/free/coupon signal.";
  }

  return "Telegram returned zero updates. This private channel cannot be scraped from its invite link; the bot must be added as a channel admin and only new posts after that can be imported.";
}

function telegramPageResultMessage(messageCount, dealCount, pageUrls, failedPageCount = 0) {
  const sourceText = Array.isArray(pageUrls) ? pageUrls.join(", ") : pageUrls;
  if (dealCount > 0) {
    return `Scraped ${dealCount} best low-price deal posts from ${sourceText}. Open /api/deals to verify them.`;
  }

  if (failedPageCount > 0) {
    return `Telegram page scrape could not reach ${failedPageCount} channel page(s): ${sourceText}. Check failedPages for the exact timeout or HTTP error.`;
  }

  if (messageCount > 0) {
    return `Scraped ${messageCount} Telegram posts from ${sourceText}, but none looked like deal posts with a price/free/coupon signal.`;
  }

  return `No public Telegram posts were available at ${sourceText}. Private invite links cannot expose channel history.`;
}

function telegramUpdatesToDeals(updates, source) {
  const allowedChats = allowedChatSet(source);
  const deals = [];

  for (const update of updates) {
    const message = update.channel_post || update.edited_channel_post || update.message || update.edited_message;
    if (!message || !isAllowedChat(message, allowedChats)) continue;

    const deal = telegramMessageToDeal(update, message, source);
    if (deal) deals.push(deal);
  }

  return uniqueBy(deals, (deal) => deal.sourceProductId);
}

function telegramPageMessagesToDeals(messages, source) {
  const deals = [];

  for (const pageMessage of messages) {
    const textWithLinks = [pageMessage.text, ...pageMessage.urls].filter(Boolean).join("\n");
    const update = { update_id: pageMessage.messageId };
    const message = {
      message_id: pageMessage.messageId,
      text: textWithLinks,
      chat: {
        id: pageMessage.channel,
        username: pageMessage.channel,
        title: source.source_name
      }
    };
    const deal = telegramMessageToDeal(update, message, source);
    if (!deal) continue;

    deal.sourceProductId = pageMessage.sourceProductId;
    deal.sourceUrl = pageMessage.postUrl || deal.sourceUrl;
    deal.affiliateLink = pageMessage.urls.find(isProductUrl) || deal.affiliateLink;
    deal.dedupeKey = `${source.source_key}:${hashString(deal.sourceProductId)}`;
    deal.slug = `${slugify(deal.title)}-${hashString(deal.sourceProductId).slice(0, 8)}`;
    deal.imageUrl = pageMessage.imageUrl || deal.imageUrl;
    deal.rawPayload = {
      ...deal.rawPayload,
      connectorMode: "telegram-page",
      telegramPageUrl: pageMessage.pageUrl,
      telegramPostUrl: pageMessage.postUrl,
      telegramChannel: pageMessage.channel,
      telegramMessageId: pageMessage.messageId
    };

    deals.push(deal);
  }

  return uniqueBy(deals, (deal) => deal.sourceProductId);
}

function selectBestDeals(deals, fraction = DEFAULT_BEST_DEAL_FRACTION) {
  const uniqueDeals = uniqueBy(deals, (deal) => deal.dedupeKey || deal.sourceProductId);
  if (uniqueDeals.length <= 1) return uniqueDeals;

  const keepCount = Math.max(1, Math.ceil(uniqueDeals.length * fraction));
  return uniqueDeals
    .map((deal) => ({ deal, score: dealQualityScore(deal) }))
    .filter((item) => item.score.isQualified)
    .sort((a, b) =>
      b.score.discountRank - a.score.discountRank ||
      a.score.priceRank - b.score.priceRank ||
      b.score.detailRank - a.score.detailRank ||
      b.score.imageRank - a.score.imageRank
    )
    .slice(0, keepCount)
    .map((item) => ({
      ...item.deal,
      rawPayload: {
        ...item.deal.rawPayload,
        bestDealFilter: {
          mode: "top-third-highest-discount-lowest-price",
          priceRank: item.score.priceRank,
          discountRank: item.score.discountRank,
          detailRank: item.score.detailRank,
          imageRank: item.score.imageRank
        }
      }
    }));
}

function dealQualityScore(deal) {
  const discountedPrice = money(deal.discountedPrice);
  const originalPrice = money(deal.originalPrice);
  const discount = Number(deal.discountPercentage || calculateDiscount(originalPrice, discountedPrice));
  const isFree = discountedPrice === 0;
  const hasImage = isHttpUrl(deal.imageUrl);
  const hasExternalProductUrl = isProductUrl(deal.affiliateLink);
  const hasReadableTitle = cleanText(deal.title).length >= 8;
  const priceRank = isFree ? 0 : discountedPrice > 0 ? discountedPrice : Number.MAX_SAFE_INTEGER;
  const hasStrongPriceSignal = isFree ||
    discountedPrice > 0 &&
    (
      discount >= 30 ||
      discountedPrice <= Number(process.env.GENIE_LOOT_CHEAP_PRICE_LIMIT || 999) ||
      /\b(lowest|loot|error|flash|deal|off|coupon)\b/i.test(`${deal.title} ${deal.description}`)
    );
  const detailRank = [
    hasExternalProductUrl,
    hasImage,
    hasReadableTitle,
    cleanText(deal.description).length >= 30,
    String(deal.couponCode || "").length >= 3
  ].filter(Boolean).length;

  return {
    isQualified: priceRank < Number.MAX_SAFE_INTEGER && hasStrongPriceSignal && hasExternalProductUrl && hasReadableTitle,
    priceRank,
    discountRank: discount,
    detailRank,
    imageRank: hasImage ? 1 : 0
  };
}

function parseTelegramPageMessages(html, pageUrl) {
  return html
    .split(/(?=<div class="tgme_widget_message\b)/g)
    .filter((block) => block.includes("data-post="))
    .map((block) => parseTelegramPageMessageBlock(block, pageUrl))
    .filter(Boolean);
}

function parseTelegramReaderMessages(markdown, pageUrl) {
  const channel = telegramChannelFromPageUrl(pageUrl);
  if (!channel) return [];

  const postLinkPattern = new RegExp(`views(?:\\s+[^\\n,]+,)?\\[[^\\]]+\\]\\(https://t\\.me/${escapeRegExp(channel)}/(\\d+)\\)`, "gi");
  const matches = [...String(markdown || "").matchAll(postLinkPattern)];
  if (matches.length === 0) {
    return parseTelegramReaderImageBlocks(markdown, pageUrl, channel);
  }

  const messages = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const messageId = Number(match[1]);
    if (!Number.isFinite(messageId)) continue;

    const previousEnd = index > 0 ? (matches[index - 1].index || 0) + matches[index - 1][0].length : 0;
    const block = markdown.slice(previousEnd, match.index || 0);
    const text = readerMessageText(block, channel);
    const urls = extractMarkdownUrls(block)
      .filter((url) => !isTelegramChromeUrl(url))
      .filter(isProductUrl)
      .filter(isHttpUrl);
    const imageUrl = readerImageUrl(block);

    messages.push({
      sourceProductId: `telegram-page:${channel}:${messageId}`,
      channel,
      messageId,
      pageUrl,
      postUrl: `https://t.me/${channel}/${messageId}`,
      text,
      urls,
      imageUrl
    });
  }

  return messages.filter((message) => message.text || message.urls.length > 0);
}

function parseTelegramReaderImageBlocks(markdown, pageUrl, channel) {
  return String(markdown || "")
    .split(/(?=\[_?!?\[Image\s+\d+])/gi)
    .map((block) => parseTelegramReaderImageBlock(block, pageUrl, channel))
    .filter(Boolean);
}

function parseTelegramReaderImageBlock(block, pageUrl, channel) {
  const text = readerMessageText(block, channel);
  const urls = extractMarkdownUrls(block)
    .filter((url) => !isTelegramChromeUrl(url))
    .filter(isProductUrl)
    .filter(isHttpUrl);
  const imageUrl = readerImageUrl(block);
  const dealSignalText = [text, urls.join(" ")].join(" ");
  const hasDealSignal = extractPrices(dealSignalText).discountedPrice > 0 ||
    extractPrices(dealSignalText).isFree ||
    extractCouponCode(dealSignalText) ||
    /\b(deal|offer|sale|discount|coupon|cashback|loot|off)\b/i.test(dealSignalText);

  if (!hasDealSignal) return null;

  const messageId = `reader-${hashString(`${channel}:${block}`).slice(0, 10)}`;
  return {
    sourceProductId: `telegram-page:${channel}:${messageId}`,
    channel,
    messageId,
    pageUrl,
    postUrl: `https://t.me/${channel}`,
    text,
    urls,
    imageUrl
  };
}

function readerMessageText(block, channel) {
  const cleaned = String(block || "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, (full, label, url) => {
      const safeUrl = decodeMarkdownUrl(url);
      if (isTelegramChromeUrl(safeUrl)) return " ";
      if (safeUrl.includes(`/s/${channel}?q=%23`)) return " ";
      if (safeUrl.includes(`t.me/${channel}`)) return " ";
      return `${label} ${safeUrl}`;
    })
    .replace(/[#*_`[\]()]/g, " ")
    .replace(/\b\d+(?:\.\d+)?K?\s+(?:views|photos|links|subscribers)\b/gi, " ")
    .replace(/\b(?:June|July|August|September|October|November|December|January|February|March|April|May)\s+\d+\b/gi, " ")
    .split(/\r?\n/)
    .map(cleanText)
    .filter(Boolean)
    .filter((line) => !/^download telegram$/i.test(line))
    .filter((line) => !/^join$/i.test(line))
    .filter((line) => !/^(title|url source|markdown content)\s*:/i.test(line))
    .join("\n");

  return cleaned.trim();
}

function extractMarkdownUrls(value) {
  const urls = new Set();
  for (const match of String(value || "").matchAll(/\[[^\]]*]\((https?:\/\/[^)]+)\)/gi)) {
    urls.add(stripTrailingPunctuation(decodeMarkdownUrl(match[1])));
  }
  for (const match of String(value || "").matchAll(/https?:\/\/[^\s)>\]]+/gi)) {
    urls.add(stripTrailingPunctuation(decodeMarkdownUrl(match[0])));
  }
  return [...urls];
}

function readerImageUrl(block) {
  for (const match of String(block || "").matchAll(/!\[[^\]]*]\((https?:\/\/[^)]+)\)/gi)) {
    const imageUrl = absoluteHttpUrl(stripTrailingPunctuation(decodeMarkdownUrl(match[1])));
    if (isHttpUrl(imageUrl) && !/telegram\.org\/img\/emoji/i.test(imageUrl)) return imageUrl;
  }
  return "";
}

function parseTelegramPageMessageBlock(block, pageUrl) {
  const dataPost = decodeHtml(attributeValue(block, "data-post"));
  const [channel, messageIdValue] = dataPost.split("/");
  const messageId = Number(messageIdValue);
  if (!channel || !Number.isFinite(messageId)) return null;

  const textHtml = block.match(/<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
  const text = htmlToText(textHtml);
  const urls = extractHrefs(block)
    .filter((url) => !isTelegramChromeUrl(url))
    .filter(isProductUrl)
    .filter(isHttpUrl);
  const imageUrl = extractTelegramPageImage(block);

  return {
    sourceProductId: `telegram-page:${channel}:${messageId}`,
    channel,
    messageId,
    pageUrl,
    postUrl: `https://t.me/${channel}/${messageId}`,
    text,
    urls,
    imageUrl
  };
}

function telegramMessageToDeal(update, message, source) {
  const rawText = message.text || message.caption || "";
  const text = cleanText(rawText);
  if (!text) return null;

  const urls = extractUrls(rawText, [...(message.entities || []), ...(message.caption_entities || [])]);
  const productUrl = urls.find(isProductUrl) || telegramMessageUrl(message) || SOURCE_URL;
  const prices = extractPrices(text);
  const textDiscountPercent = extractDiscountPercent(text);
  const couponCode = extractCouponCode(text);
  const hasDealSignal = prices.isFree ||
    prices.discountedPrice > 0 ||
    couponCode ||
    /\b(deal|offer|sale|discount|coupon|cashback|loot)\b/i.test(text);

  if (!hasDealSignal || (prices.discountedPrice <= 0 && !prices.isFree)) return null;

  const title = extractTitle(rawText);
  if (!title) return null;

  const discountedPrice = prices.isFree ? 0 : prices.discountedPrice;
  const inferredOriginalPrice = textDiscountPercent > 0 && textDiscountPercent < 100 && discountedPrice > 0
    ? Math.round((discountedPrice / (1 - textDiscountPercent / 100)) * 100) / 100
    : 0;
  const originalPrice = Math.max(prices.originalPrice, inferredOriginalPrice, discountedPrice);
  const sourceProductId = `telegram:${message.chat.id}:${message.message_id}`;

  return {
    sourceKey: source.source_key,
    sourceName: source.source_name,
    sourceProductId,
    sourceUrl: productUrl,
    dedupeKey: `${source.source_key}:${hashString(sourceProductId)}`,
    slug: `${slugify(title)}-${hashString(sourceProductId).slice(0, 8)}`,
    title,
    description: truncateClean(cleanText(removeUrls(rawText)), 220) || title,
    storeName: source.source_name,
    storeSlug: slugify(source.source_name),
    storeUrl: SOURCE_URL,
    categoryName: inferCategory(text),
    categorySlug: slugify(inferCategory(text)),
    originalPrice,
    discountedPrice,
    discountPercentage: textDiscountPercent || calculateDiscount(originalPrice, discountedPrice),
    dealType: discountedPrice === 0 ? "FREE_DEAL" : couponCode ? "COUPON" : "DISCOUNT",
    couponCode,
    cashbackPercentage: 0,
    affiliateLink: productUrl,
    imageUrl: process.env.TELEGRAM_DEFAULT_IMAGE_URL || "",
    expiryDate: daysFromNow(Number(process.env.TELEGRAM_EXPIRY_DAYS || 7)),
    isFeatured: discountedPrice === 0 || calculateDiscount(originalPrice, discountedPrice) >= 50,
    rawPayload: {
      connectorMode: "telegram-bot",
      sourceKey: source.source_key,
      sourceProductId,
      sourceUrl: productUrl,
      telegramUpdateId: update.update_id,
      telegramChatId: String(message.chat.id),
      telegramChatTitle: message.chat.title || "",
      telegramChatUsername: message.chat.username || "",
      telegramMessageId: message.message_id,
      originalText: rawText,
      parsedDiscountPercent: textDiscountPercent,
      normalizedAt: new Date().toISOString()
    }
  };
}

async function upsertDeal(deal) {
  const storeId = await ensureStore(deal);
  const categoryId = await ensureCategory(deal);
  const existing = await findExistingDeal(deal.dedupeKey);
  const now = new Date().toISOString();
  const imageUrl = dealImageUrl(deal);
  const payload = {
    title: deal.title,
    slug: deal.slug,
    description: deal.description,
    store_id: storeId,
    category_id: categoryId,
    original_price: deal.originalPrice,
    discounted_price: deal.discountedPrice,
    discount_percentage: deal.discountPercentage,
    coupon_code: deal.couponCode,
    cashback_percentage: deal.cashbackPercentage,
    affiliate_link: deal.affiliateLink,
    image_url: imageUrl,
    expiry_date: deal.expiryDate,
    status: "active",
    is_featured: deal.isFeatured,
    is_verified: true,
    updated_at: now,
    source: deal.dealType,
    source_product_id: deal.sourceProductId,
    source_url: deal.sourceUrl,
    dedupe_key: deal.dedupeKey,
    last_scraped_at: now,
    raw_source_payload: {
      ...deal.rawPayload,
      imageUrl
    }
  };

  if (existing?.id) {
    const { data, error } = await supabaseAdmin
      .from("deals")
      .update(payload)
      .eq("id", existing.id)
      .select("id")
      .single();

    throwIfSupabaseError(error, "deals");
    return { action: "updated", dealId: data.id };
  }

  const { data, error } = await supabaseAdmin
    .from("deals")
    .insert({ ...payload, created_at: now })
    .select("id")
    .single();

  throwIfSupabaseError(error, "deals");
  return { action: "imported", dealId: data.id };
}

async function findExistingDeal(dedupeKey) {
  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("id")
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();

  throwIfSupabaseError(error, "deals");
  return data;
}

async function deactivateRejectedDeals(deals) {
  const dedupeKeys = uniqueBy(deals, (deal) => deal.dedupeKey)
    .map((deal) => deal.dedupeKey)
    .filter(Boolean);
  if (dedupeKeys.length === 0) return 0;

  let pruned = 0;
  const now = new Date().toISOString();
  for (const dedupeKey of dedupeKeys) {
    const { data, error } = await supabaseAdmin
      .from("deals")
      .update({
        status: "rejected",
        updated_at: now
      })
      .eq("dedupe_key", dedupeKey)
      .eq("raw_source_payload->>connectorMode", "telegram-page")
      .select("id");

    throwIfSupabaseError(error, "deals");
    pruned += Array.isArray(data) ? data.length : 0;
  }

  return pruned;
}

async function deactivateUnselectedTelegramPageDeals(selectedKeys) {
  if (/^false$/i.test(String(process.env.GENIE_LOOT_REJECT_UNSELECTED || ""))) return 0;

  const { data, error } = await supabaseAdmin
    .from("deals")
    .select("id,dedupe_key")
    .eq("status", "active")
    .eq("raw_source_payload->>connectorMode", "telegram-page")
    .limit(Number(process.env.GENIE_LOOT_STALE_SCAN_LIMIT || 5000));

  throwIfSupabaseError(error, "deals");

  const staleIds = (data || [])
    .filter((deal) => deal.dedupe_key && !selectedKeys.has(deal.dedupe_key))
    .map((deal) => deal.id);
  if (staleIds.length === 0) return 0;

  let pruned = 0;
  const now = new Date().toISOString();
  for (const chunk of chunks(staleIds, 100)) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("deals")
      .update({
        status: "rejected",
        updated_at: now
      })
      .in("id", chunk)
      .select("id");

    throwIfSupabaseError(updateError, "deals");
    pruned += Array.isArray(updated) ? updated.length : 0;
  }

  return pruned;
}

async function ensureStore(deal) {
  const { data, error } = await supabaseAdmin
    .from("stores")
    .upsert({
      name: deal.storeName,
      slug: deal.storeSlug,
      website_url: deal.storeUrl,
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();

  throwIfSupabaseError(error, "stores");
  return data?.id || null;
}

async function ensureCategory(deal) {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .upsert({
      name: deal.categoryName,
      slug: deal.categorySlug,
      is_active: true
    }, { onConflict: "slug" })
    .select("id")
    .single();

  throwIfSupabaseError(error, "categories");
  return data?.id || null;
}

async function recordScrapedItem(jobId, source, deal, status, errorMessage, dealId = null) {
  const { error } = await supabaseAdmin
    .from("scraped_deal_items")
    .insert({
      scraper_job_id: jobId,
      deal_source_id: source.id,
      source_key: source.source_key,
      source_product_id: deal.sourceProductId,
      source_url: deal.sourceUrl,
      title: deal.title,
      raw_payload: deal.rawPayload,
      normalized_payload: deal,
      dedupe_key: deal.dedupeKey,
      status,
      error_message: errorMessage,
      matched_deal_id: dealId
    });

  throwIfSupabaseError(error, "scraped_deal_items");
}

async function recordFailedItem(jobId, source, deal, error) {
  await recordScrapedItem(
    jobId,
    source,
    deal,
    "failed",
    error instanceof Error ? error.message : "Telegram deal import failed."
  );
}

function allowedChatSet(source) {
  const config = source.config || {};
  const rawValues = [
    config.channelId,
    config.chatId,
    ...(Array.isArray(config.channelIds) ? config.channelIds : []),
    ...(Array.isArray(config.chatIds) ? config.chatIds : []),
    process.env.TELEGRAM_ALLOWED_CHAT_IDS || ""
  ];

  return new Set(rawValues
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean));
}

function isAllowedChat(message, allowedChats) {
  if (allowedChats.size === 0) return true;

  const chatId = String(message.chat?.id || "").toLowerCase();
  const username = String(message.chat?.username || "").toLowerCase();
  const title = String(message.chat?.title || "").toLowerCase();

  return allowedChats.has(chatId) ||
    allowedChats.has(username) ||
    allowedChats.has(`@${username}`) ||
    allowedChats.has(title);
}

function extractUrls(text, entities) {
  const urls = new Set();

  for (const entity of entities) {
    if (entity.type === "text_link" && entity.url) urls.add(stripTrailingPunctuation(entity.url));
    if (entity.type === "url" && Number.isFinite(entity.offset) && Number.isFinite(entity.length)) {
      urls.add(stripTrailingPunctuation(text.substring(entity.offset, entity.offset + entity.length)));
    }
  }

  for (const match of text.matchAll(/https?:\/\/[^\s)>\]]+/gi)) {
    urls.add(stripTrailingPunctuation(match[0]));
  }

  return [...urls].filter(isHttpUrl);
}

function extractPrices(text) {
  const isFree = /\bfree\b|(?:\u20b9|rs\.?|inr)\s*0(?:\.00)?\b/i.test(text);
  const originalPrice = labelledPrice(text, /\b(mrp|original|was|list price|regular price)\b/i, "max");
  const dealPrice = explicitDealPrice(text) ||
    labelledPrice(text, /\b(deal price|offer price|sale price|now|only|price)\b/i, "min");
  const prices = uniqueNumbers([
    ...allCurrencyPrices(text),
    ...(originalPrice > 0 ? unlabeledNumericPriceCandidates(text) : [])
  ]);

  if (isFree) {
    return { originalPrice: originalPrice || Math.max(...prices, 0), discountedPrice: 0, isFree: true };
  }

  if (dealPrice > 0) {
    return { originalPrice: Math.max(originalPrice, dealPrice), discountedPrice: dealPrice, isFree: false };
  }

  if (originalPrice > 0) {
    const belowOriginal = prices.filter((price) => price > 0 && price < originalPrice);
    if (belowOriginal.length) {
      return { originalPrice, discountedPrice: Math.min(...belowOriginal), isFree: false };
    }
  }

  if (prices.length >= 2) {
    return { originalPrice: Math.max(...prices), discountedPrice: Math.min(...prices), isFree: false };
  }

  const onlyPrice = prices[0] || 0;
  return { originalPrice: Math.max(originalPrice, onlyPrice), discountedPrice: onlyPrice, isFree: false };
}

function explicitDealPrice(text) {
  const patterns = [
    /(?:@|at|for|only|just|deal price|offer price|sale price|now|price)\s*(?:\u20b9|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?!\s*%)/i,
    /(?:\u20b9|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?!\s*%)/i
  ];

  for (const pattern of patterns) {
    const price = money(String(text || "").match(pattern)?.[1]);
    if (price > 0) return price;
  }

  return 0;
}

function labelledPrice(text, labelPattern, preference) {
  for (const line of text.split(/\r?\n/)) {
    const label = line.match(labelPattern);
    if (!label) continue;
    const prices = allCurrencyPrices(line.slice(label.index || 0));
    if (prices.length) return preference === "max" ? Math.max(...prices) : Math.min(...prices);
  }
  return 0;
}

function allCurrencyPrices(text) {
  const prices = new Set();
  const prefixPattern = /(?:\u20b9|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?!\s*%)/gi;
  const suffixPattern = /([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr)\b/gi;
  const shorthandPattern = /(?:@|at|only)\s*(?:\u20b9|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?!\s*%)/gi;

  for (const match of text.matchAll(prefixPattern)) prices.add(money(match[1]));
  for (const match of text.matchAll(suffixPattern)) prices.add(money(match[1]));
  for (const match of text.matchAll(shorthandPattern)) prices.add(money(match[1]));
  return [...prices].filter((price) => price >= 0).sort((a, b) => a - b);
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

function uniqueNumbers(values) {
  return [...new Set(values.map(money).filter((value) => value >= 0))].sort((a, b) => a - b);
}

function extractCouponCode(text) {
  const direct = text.match(/\b(?:coupon|code|promo)\s*[:#-]?\s*([A-Z0-9]{4,20})\b/i);
  if (direct?.[1]) return direct[1].toUpperCase();
  const nearby = text.match(/\b([A-Z0-9]{4,20})\b(?=[^\n]{0,24}\b(?:coupon|code|promo)\b)/i);
  return nearby?.[1]?.toUpperCase() || "";
}

function extractDiscountPercent(text) {
  const matches = [...String(text || "").matchAll(/\b([1-9][0-9]?)\s*%\s*(?:off|discount)\b/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 100);
  return matches.length ? Math.max(...matches) : 0;
}

function extractTitle(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => cleanText(removeUrls(line)))
    .filter(Boolean);

  return truncateClean(lines.find((line) => /[a-z0-9]/i.test(line) && !isMostlyPriceOrCoupon(line)) || lines[0] || "Telegram Deal", 96);
}

function inferCategory(text) {
  const value = text.toLowerCase();
  if (/phone|mobile|earbud|speaker|laptop|watch|camera|charger|tablet|headphone/.test(value)) return "Electronics";
  if (/shirt|shoe|jeans|dress|fashion|bag|backpack|kurta|saree/.test(value)) return "Fashion";
  if (/book|course|student|exam|ebook/.test(value)) return "Student Deals";
  if (/food|grocery|kitchen|snack|tea|coffee/.test(value)) return "Grocery";
  if (/software|app|subscription|hosting|domain|vpn/.test(value)) return "Digital";
  return "General";
}

function dealImageUrl(deal) {
  const imageUrl = cleanText(deal.imageUrl);
  return firstHttpUrl([
    imageUrl,
    amazonImageFromUrl(deal.affiliateLink),
    amazonImageFromUrl(deal.sourceUrl),
    fallbackDealImage(deal.title, deal.categoryName, deal.storeName)
  ]);
}

function firstHttpUrl(values) {
  return values.map((value) => cleanText(value)).find(isHttpUrl) || "";
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

function fallbackDealImage(title, categoryName, storeName) {
  const text = `${title || ""} ${categoryName || ""} ${storeName || ""}`.toLowerCase();
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

function containsAny(text, tokens) {
  return tokens.some((token) => text.includes(token));
}

function telegramMessageUrl(message) {
  const username = cleanText(message.chat?.username || "");
  if (username) return `https://t.me/${username}/${message.message_id}`;

  const chatId = String(message.chat?.id || "");
  return chatId.startsWith("-100") ? `https://t.me/c/${chatId.slice(4)}/${message.message_id}` : "";
}

function telegramPageUrls(options = {}) {
  const rawValues = [
    options.pageUrls,
    options.urls,
    options.pageUrl,
    process.env.GENIE_LOOT_PAGE_URLS,
    process.env.GENIE_LOOT_PAGE_URL
  ];
  const configured = rawValues
    .flatMap((value) => stringList(value))
    .map(normalizeTelegramPageUrl)
    .filter(Boolean);

  return uniqueBy(configured.length ? configured : DEFAULT_GENIE_LOOT_PAGE_URLS, (url) => url);
}

function bestDealFraction(value) {
  const fraction = Number(value || DEFAULT_BEST_DEAL_FRACTION);
  return Number.isFinite(fraction) && fraction > 0 && fraction <= 1 ? fraction : DEFAULT_BEST_DEAL_FRACTION;
}

function stringList(value) {
  if (Array.isArray(value)) return value.flatMap(stringList);
  return String(value || "")
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTelegramPageUrl(value) {
  const parsed = new URL(value);
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "t.me" && host !== "telegram.me") {
    throw new Error("Telegram page URL must be on t.me or telegram.me.");
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  const channel = parts[0] === "s" ? parts[1] : parts[0];
  if (!channel || channel.startsWith("+")) {
    throw new Error("Private Telegram invite links cannot be scraped. Use a public channel preview URL like https://t.me/s/channel_name.");
  }

  return `https://t.me/s/${channel}`;
}

function telegramChannelFromPageUrl(value) {
  try {
    const parsed = new URL(normalizeTelegramPageUrl(value));
    return parsed.pathname.split("/").filter(Boolean)[1] || "";
  } catch {
    return "";
  }
}

function withBeforeParam(pageUrl, beforeMessageId) {
  const url = new URL(pageUrl);
  url.searchParams.set("before", String(beforeMessageId));
  return url.toString();
}

function attributeValue(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`${escaped}="([^"]*)"`, "i"))?.[1] || "";
}

function htmlToText(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
  ).trim();
}

function extractHrefs(html) {
  return [...html.matchAll(/href="([^"]+)"/gi)]
    .map((match) => decodeHtml(match[1]))
    .map(stripTrailingPunctuation);
}

function extractTelegramPageImage(html) {
  const styleUrl = html.match(/background-image:url\(['"]?([^'")]+)['"]?\)/i)?.[1] || "";
  const imgSrc = html.match(/<img[^>]+src="([^"]+)"/i)?.[1] || "";
  const imageUrl = absoluteHttpUrl(decodeHtml(styleUrl || imgSrc));
  return /telegram\.org\/img\/emoji/i.test(imageUrl) ? "" : imageUrl;
}

function isTelegramChromeUrl(value) {
  try {
    const parsed = new URL(value, "https://t.me");
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return host === "t.me" ||
      host === "telegram.me" ||
      host === "telegram.org";
  } catch {
    return false;
  }
}

function absoluteHttpUrl(value) {
  if (String(value || "").startsWith("//")) return `https:${value}`;
  return value;
}

function calculateDiscount(originalPrice, discountedPrice) {
  if (originalPrice <= 0) return discountedPrice === 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)));
}

function slugify(value) {
  return cleanText(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "deal";
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function daysFromNow(days) {
  return new Date(Date.now() + Math.max(1, days) * DAY_MS).toISOString();
}

function uniqueBy(items, getKey) {
  return [...new Map(items.map((item) => [getKey(item), item])).values()];
}

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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

function truncateClean(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength + 1);
  return truncated.slice(0, truncated.lastIndexOf(" ")).trim() || text.slice(0, maxLength).trim();
}

function removeUrls(value) {
  return String(value || "").replace(/https?:\/\/[^\s)>\]]+/gi, " ");
}

function stripTrailingPunctuation(value) {
  return String(value || "").replace(/[),.]+$/g, "");
}

function decodeMarkdownUrl(value) {
  return decodeHtml(String(value || "").replace(/\\([_()[\].])/g, "$1"));
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isMostlyPriceOrCoupon(value) {
  return /^(?:price|mrp|coupon|code|promo|link)\b/i.test(value) ||
    (allCurrencyPrices(value).length > 0 && value.length < 28);
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isProductUrl(value) {
  return isHttpUrl(value) && !isTelegramInviteUrl(value) && !isTelegramUrl(value) && !isImageAssetUrl(value);
}

function isImageAssetUrl(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    return host.includes("telesco.pe") ||
      host === "cdn4.cdn-telegram.org" ||
      host === "cdn5.cdn-telegram.org" ||
      /\.(?:avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(pathname);
  } catch {
    return false;
  }
}

function isTelegramInviteUrl(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const firstPathPart = parsed.pathname.split("/").filter(Boolean)[0] || "";
    return (host === "t.me" || host === "telegram.me") && firstPathPart.startsWith("+");
  } catch {
    return false;
  }
}

function isTelegramUrl(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return host === "t.me" || host === "telegram.me";
  } catch {
    return false;
  }
}

function money(value) {
  const numeric = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : 0;
}

function telegramBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!token) {
    const error = new Error("TELEGRAM_BOT_TOKEN is required. Add your bot token to .env and restart the backend.");
    error.statusCode = 500;
    throw error;
  }
  return token;
}

module.exports = { getTelegramStatus, importTelegramDeals, scrapeGenieLootPage };
