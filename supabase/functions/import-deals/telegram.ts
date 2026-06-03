import type { DealSourceRow, JsonObject, SourceDeal } from "./types.ts";

type TelegramApiResponse = {
  ok?: boolean;
  result?: unknown;
  description?: string;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
};

type TelegramMessage = {
  message_id: number;
  date?: number;
  text?: string;
  caption?: string;
  chat: {
    id: number | string;
    type?: string;
    title?: string;
    username?: string;
  };
  entities?: TelegramEntity[];
  caption_entities?: TelegramEntity[];
};

type TelegramEntity = {
  type: string;
  offset?: number;
  length?: number;
  url?: string;
};

type PriceParseResult = {
  originalPrice: number;
  discountedPrice: number;
  isFree: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TELEGRAM_LIMIT = 100;
const DEFAULT_TELEGRAM_TIMEOUT_MS = 12000;
const TELEGRAM_ALLOWED_UPDATES = [
  "message",
  "edited_message",
  "channel_post",
  "edited_channel_post"
];

export async function fetchTelegramDeals(source: DealSourceRow): Promise<SourceDeal[]> {
  const token = telegramBotToken(source);
  const updates = await fetchTelegramUpdates(token, source);
  const dealsByMessage = new Map<string, SourceDeal>();

  for (const update of updates) {
    const message = update.channel_post || update.edited_channel_post || update.message || update.edited_message;
    if (!message || !isAllowedTelegramChat(source, message)) continue;

    const deal = telegramMessageToDeal(source, update, message);
    if (deal) dealsByMessage.set(deal.sourceProductId, deal);
  }

  await acknowledgeTelegramUpdates(token, updates);
  return [...dealsByMessage.values()];
}

async function fetchTelegramUpdates(token: string, source: DealSourceRow): Promise<TelegramUpdate[]> {
  const response = await telegramApi(token, "getUpdates", {
    allowed_updates: JSON.stringify(TELEGRAM_ALLOWED_UPDATES),
    limit: String(telegramLimit(source)),
    timeout: "0"
  });

  return Array.isArray(response.result)
    ? response.result.filter(isTelegramUpdate)
    : [];
}

async function acknowledgeTelegramUpdates(token: string, updates: TelegramUpdate[]): Promise<void> {
  const maxUpdateId = updates.reduce((max, update) => Math.max(max, update.update_id), -1);
  if (maxUpdateId < 0) return;

  try {
    await telegramApi(token, "getUpdates", {
      allowed_updates: JSON.stringify(TELEGRAM_ALLOWED_UPDATES),
      limit: "1",
      offset: String(maxUpdateId + 1),
      timeout: "0"
    });
  } catch (error) {
    console.warn("Telegram update acknowledgement failed", sanitizeError(error, token));
  }
}

function telegramMessageToDeal(
  source: DealSourceRow,
  update: TelegramUpdate,
  message: TelegramMessage
): SourceDeal | null {
  const rawText = message.text || message.caption || "";
  const text = cleanText(rawText);
  if (!text) return null;

  const urls = extractTelegramUrls(rawText, [
    ...(message.entities || []),
    ...(message.caption_entities || [])
  ]);
  const productUrl = urls.find((url) => !isTelegramInviteUrl(url)) || telegramMessageUrl(source, message);
  const prices = extractPrices(text);
  const couponCode = extractCouponCode(text);
  const hasDealSignal = prices.isFree ||
    prices.discountedPrice > 0 ||
    couponCode ||
    /\b(deal|offer|sale|discount|coupon|cashback|loot)\b/i.test(text);

  if (!hasDealSignal || (!productUrl && !prices.isFree)) return null;
  if (prices.discountedPrice <= 0 && !prices.isFree) return null;

  const title = extractTitle(rawText, source.source_name);
  if (!title) return null;

  const discountedPrice = prices.isFree ? 0 : prices.discountedPrice;
  const originalPrice = Math.max(prices.originalPrice, discountedPrice);
  const sourceUrl = productUrl || source.base_url;

  return {
    sourceProductId: `telegram:${message.chat.id}:${message.message_id}`,
    sourceUrl,
    title,
    description: descriptionFromTelegramText(rawText, title),
    categoryName: inferCategory(text, source),
    originalPrice,
    discountedPrice,
    couponCode,
    imageUrl: telegramDefaultImageUrl(source),
    affiliateUrl: sourceUrl,
    expiryDate: daysFromNow(telegramExpiryDays(source)),
    raw: {
      connectorMode: "telegram-bot",
      sourceKey: source.source_key,
      sourceName: source.source_name,
      capturedAt: new Date().toISOString(),
      telegramUpdateId: update.update_id,
      telegramChatId: String(message.chat.id),
      telegramChatType: message.chat.type || "",
      telegramChatTitle: message.chat.title || "",
      telegramChatUsername: message.chat.username || "",
      telegramMessageId: message.message_id,
      telegramMessageDate: message.date ? new Date(message.date * 1000).toISOString() : ""
    }
  };
}

async function telegramApi(
  token: string,
  method: string,
  params: Record<string, string>
): Promise<TelegramApiResponse> {
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), telegramTimeoutMs());

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "accept": "application/json" }
    });
    const payload = await response.json().catch(() => ({})) as TelegramApiResponse;

    if (!response.ok || payload.ok !== true) {
      const description = payload.description ? `: ${payload.description}` : "";
      throw new Error(`Telegram ${method} failed with HTTP ${response.status}${description}`);
    }

    return payload;
  } catch (error) {
    throw new Error(sanitizeError(error, token));
  } finally {
    clearTimeout(timeout);
  }
}

function telegramBotToken(source: DealSourceRow): string {
  const secretName = cleanText(source.secret_name || "TELEGRAM_BOT_TOKEN") || "TELEGRAM_BOT_TOKEN";
  const token = Deno.env.get(secretName) || Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
  if (!token) {
    throw new Error(`${secretName} is required for Telegram deal imports.`);
  }
  return token;
}

function isAllowedTelegramChat(source: DealSourceRow, message: TelegramMessage): boolean {
  const chatType = String(message.chat.type || "").toLowerCase();
  if (chatType && !["channel", "supergroup"].includes(chatType)) return false;

  const allowedChats = telegramAllowedChats(source);
  if (allowedChats.size === 0) return true;

  const chatId = String(message.chat.id);
  const username = cleanText(message.chat.username || "").toLowerCase();
  const title = cleanText(message.chat.title || "").toLowerCase();

  return allowedChats.has(chatId) ||
    (username ? allowedChats.has(username) || allowedChats.has(`@${username}`) : false) ||
    (title ? allowedChats.has(title) : false);
}

function telegramAllowedChats(source: DealSourceRow): Set<string> {
  const config = sourceConfig(source);
  const values = [
    ...stringList(config.chatIds),
    ...stringList(config.channelIds),
    ...stringList(config.channelUsernames),
    stringValue(config.chatId),
    stringValue(config.channelId),
    stringValue(config.channelUsername),
    publicTelegramUsername(source.base_url),
    Deno.env.get(`TELEGRAM_CHAT_IDS_${envKey(source.source_key)}`) || "",
    Deno.env.get("TELEGRAM_ALLOWED_CHAT_IDS") || ""
  ];

  return new Set(values
    .flatMap((value) => String(value || "").split(","))
    .map((value) => cleanText(value).toLowerCase())
    .filter(Boolean));
}

function extractTelegramUrls(text: string, entities: TelegramEntity[]): string[] {
  const urls = new Set<string>();

  for (const entity of entities) {
    if (entity.type === "text_link" && entity.url) {
      urls.add(stripTrailingPunctuation(entity.url));
    }

    if (entity.type === "url" && isFiniteNumber(entity.offset) && isFiniteNumber(entity.length)) {
      urls.add(stripTrailingPunctuation(text.substring(entity.offset || 0, (entity.offset || 0) + (entity.length || 0))));
    }
  }

  for (const match of text.matchAll(/https?:\/\/[^\s)>\]]+/gi)) {
    urls.add(stripTrailingPunctuation(match[0]));
  }

  return [...urls].filter(isHttpUrl);
}

function extractPrices(text: string): PriceParseResult {
  const isFree = /\bfree\b|(?:\u20b9|rs\.?|inr)\s*0(?:\.00)?\b/i.test(text);
  const originalPrice = labelledPrice(text, /\b(mrp|original|was|list price|regular price)\b/i, "max");
  const dealPrice = labelledPrice(text, /\b(deal price|offer price|sale price|now|only|price)\b/i, "min");
  const prices = allCurrencyPrices(text);

  if (isFree) {
    return {
      originalPrice: originalPrice || Math.max(...prices, 0),
      discountedPrice: 0,
      isFree: true
    };
  }

  if (dealPrice > 0) {
    return {
      originalPrice: Math.max(originalPrice, dealPrice),
      discountedPrice: dealPrice,
      isFree: false
    };
  }

  if (prices.length >= 2) {
    return {
      originalPrice: Math.max(...prices),
      discountedPrice: Math.min(...prices),
      isFree: false
    };
  }

  const onlyPrice = prices[0] || 0;
  return {
    originalPrice: Math.max(originalPrice, onlyPrice),
    discountedPrice: onlyPrice,
    isFree: false
  };
}

function labelledPrice(text: string, labelPattern: RegExp, preference: "min" | "max"): number {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const label = line.match(labelPattern);
    if (!label) continue;
    const prices = allCurrencyPrices(line.slice(label.index || 0));
    if (prices.length > 0) {
      return preference === "max" ? Math.max(...prices) : Math.min(...prices);
    }
  }
  return 0;
}

function allCurrencyPrices(text: string): number[] {
  const prices = new Set<number>();
  const prefixPattern = /(?:\u20b9|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;
  const suffixPattern = /([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr)\b/gi;

  for (const match of text.matchAll(prefixPattern)) prices.add(money(match[1]));
  for (const match of text.matchAll(suffixPattern)) prices.add(money(match[1]));

  return [...prices].filter((price) => price >= 0).sort((a, b) => a - b);
}

function extractCouponCode(text: string): string {
  const direct = text.match(/\b(?:coupon|code|promo)\s*[:#-]?\s*([A-Z0-9]{4,20})\b/i);
  if (direct?.[1]) return direct[1].toUpperCase();

  const nearby = text.match(/\b([A-Z0-9]{4,20})\b(?=[^\n]{0,24}\b(?:coupon|code|promo)\b)/i);
  return nearby?.[1]?.toUpperCase() || "";
}

function extractTitle(text: string, sourceName: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => cleanText(removeUrls(line)))
    .filter(Boolean);

  const title = lines.find((line) => hasLettersOrNumbers(line) && !isMostlyPriceOrCoupon(line)) ||
    lines.find(hasLettersOrNumbers) ||
    `${sourceName} Telegram Deal`;

  return truncateClean(title, 96);
}

function descriptionFromTelegramText(text: string, fallbackTitle: string): string {
  const description = truncateClean(cleanText(removeUrls(text)), 220);
  return description || fallbackTitle;
}

function inferCategory(text: string, source: DealSourceRow): string {
  const value = `${text} ${source.source_name}`.toLowerCase();
  if (/phone|mobile|earbud|speaker|laptop|watch|camera|charger|tablet|headphone/.test(value)) return "Electronics";
  if (/shirt|shoe|jeans|dress|fashion|bag|backpack|kurta|saree/.test(value)) return "Fashion";
  if (/book|course|student|exam|ebook/.test(value)) return "Student Deals";
  if (/food|grocery|kitchen|snack|tea|coffee/.test(value)) return "Grocery";
  if (/software|app|subscription|hosting|domain|vpn/.test(value)) return "Digital";
  return "General";
}

function telegramMessageUrl(source: DealSourceRow, message: TelegramMessage): string {
  const username = cleanText(message.chat.username || "");
  if (username) return `https://t.me/${username}/${message.message_id}`;

  const chatId = String(message.chat.id);
  if (chatId.startsWith("-100")) {
    return `https://t.me/c/${chatId.slice(4)}/${message.message_id}`;
  }

  return isHttpUrl(source.base_url) ? source.base_url : "";
}

function telegramDefaultImageUrl(source: DealSourceRow): string {
  const config = sourceConfig(source);
  return cleanText(
    stringValue(config.defaultImageUrl) ||
    Deno.env.get(`TELEGRAM_DEFAULT_IMAGE_URL_${envKey(source.source_key)}`) ||
    Deno.env.get("TELEGRAM_DEFAULT_IMAGE_URL") ||
    ""
  );
}

function telegramExpiryDays(source: DealSourceRow): number {
  const configDays = Number(sourceConfig(source).expiryDays);
  const envDays = Number(Deno.env.get(`TELEGRAM_EXPIRY_DAYS_${envKey(source.source_key)}`) || Deno.env.get("TELEGRAM_EXPIRY_DAYS"));
  const days = Number.isFinite(configDays) && configDays > 0 ? configDays : envDays;
  return Number.isFinite(days) && days > 0 ? days : 7;
}

function telegramLimit(source: DealSourceRow): number {
  const configLimit = Number(sourceConfig(source).pollLimit);
  const envLimit = Number(Deno.env.get(`TELEGRAM_POLL_LIMIT_${envKey(source.source_key)}`) || Deno.env.get("TELEGRAM_POLL_LIMIT"));
  const limit = Number.isFinite(configLimit) && configLimit > 0 ? configLimit : envLimit;
  return Math.min(100, Math.max(1, Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_TELEGRAM_LIMIT));
}

function telegramTimeoutMs(): number {
  const value = Number(Deno.env.get("TELEGRAM_FETCH_TIMEOUT_MS"));
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TELEGRAM_TIMEOUT_MS;
}

function publicTelegramUsername(url: string): string {
  try {
    const parsed = new URL(url);
    if (!/^(t|telegram)\.me$/i.test(parsed.hostname.replace(/^www\./, ""))) return "";
    const firstPathPart = parsed.pathname.split("/").filter(Boolean)[0] || "";
    if (!firstPathPart || firstPathPart.startsWith("+") || firstPathPart === "c") return "";
    return firstPathPart.startsWith("@") ? firstPathPart.toLowerCase() : `@${firstPathPart.toLowerCase()}`;
  } catch {
    return "";
  }
}

function sourceConfig(source: DealSourceRow): JsonObject {
  return isObject(source.config) ? source.config : {};
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || "")) : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function isTelegramUpdate(value: unknown): value is TelegramUpdate {
  return isObject(value) && isFiniteNumber(value.update_id);
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasLettersOrNumbers(value: string): boolean {
  return /[a-z0-9]/i.test(value);
}

function isMostlyPriceOrCoupon(value: string): boolean {
  return /^(?:price|mrp|coupon|code|promo|link)\b/i.test(value) || allCurrencyPrices(value).length > 0 && value.length < 28;
}

function removeUrls(value: string): string {
  return value.replace(/https?:\/\/[^\s)>\]]+/gi, " ");
}

function cleanText(value: string): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncateClean(value: string, maxLength: number): string {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength + 1);
  return truncated.slice(0, truncated.lastIndexOf(" ")).trim() || text.slice(0, maxLength).trim();
}

function stripTrailingPunctuation(value: string): string {
  return String(value || "").replace(/[),.]+$/g, "");
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isTelegramInviteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const firstPathPart = parsed.pathname.split("/").filter(Boolean)[0] || "";
    return (host === "t.me" || host === "telegram.me") && firstPathPart.startsWith("+");
  } catch {
    return false;
  }
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

function money(value: unknown): number {
  const numeric = Number(String(value || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100) / 100;
}

function envKey(value: string): string {
  return cleanText(value).toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function sanitizeError(error: unknown, token: string): string {
  const message = error instanceof Error ? error.message : String(error || "Telegram request failed");
  return message.replaceAll(token, "[redacted]");
}
