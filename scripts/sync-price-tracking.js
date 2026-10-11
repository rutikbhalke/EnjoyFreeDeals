require("dotenv").config();

const { supabaseAdmin } = require("../src/config/supabaseClient");
const { fetchProductMetadata } = require("../src/services/dealDetailEnricher");
const { trackProductPrice } = require("../src/repositories/trackPriceRepository");

async function syncPriceTracking() {
  console.log("=== STEP 1: Processing Pending Price Tracking Requests ===");
  const pendingRequests = await getPendingRequests(50);
  console.log(`Found ${pendingRequests.length} pending price tracking requests.`);

  let requestsProcessed = 0;
  for (const request of pendingRequests) {
    try {
      console.log(`Processing tracking request: ${request.product_url}`);
      await trackProductPrice(request.product_url, request.user_id);
      await supabaseAdmin
        .from("price_tracking_requests")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", request.id);
      requestsProcessed += 1;
    } catch (err) {
      console.warn(`[sync-price-tracking] request ${request.id} failed:`, err.message || err);
      await supabaseAdmin
        .from("price_tracking_requests")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", request.id)
        .catch(() => {});
    }
  }

  console.log("\n=== STEP 2: Refreshing Live Prices for Tracked Products ===");
  const trackedProducts = await getTrackedProducts(100);
  console.log(`Found ${trackedProducts.length} tracked products to re-check.`);

  let checkedCount = 0;
  let priceUpdatedCount = 0;
  let alertsTriggeredCount = 0;
  let errorCount = 0;

  for (const product of trackedProducts) {
    checkedCount += 1;
    const url = product.normalized_url || product.product_url;
    if (!url) continue;

    try {
      const meta = await fetchProductMetadata(url, { timeoutMs: 10000 });
      const newPrice = meta.priceReliable && Number(meta.discountedPrice) > 0 ? Number(meta.discountedPrice) : null;
      const newOriginalPrice = meta.originalPriceReliable && Number(meta.originalPrice) > 0 ? Number(meta.originalPrice) : null;

      if (newPrice != null) {
        priceUpdatedCount += 1;
        const currentLowest = Number(product.lowest_price) > 0 ? Number(product.lowest_price) : newPrice;
        const currentHighest = Number(product.highest_price) > 0 ? Number(product.highest_price) : newPrice;
        const lowestPrice = Math.min(currentLowest, newPrice);
        const highestPrice = Math.max(currentHighest, newPrice);

        // Update tracked_products
        await supabaseAdmin
          .from("tracked_products")
          .update({
            current_price: newPrice,
            lowest_price: lowestPrice,
            highest_price: highestPrice,
            image_url: meta.imageUrl || product.image_url,
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", product.id);

        // Record price history
        await supabaseAdmin
          .from("price_history")
          .insert({
            deal_id: product.deal_id || null,
            product_url: url,
            store_name: product.store_name,
            platform_product_id: product.platform_product_id || null,
            price: newPrice,
            currency: product.currency || "INR",
            checked_at: new Date().toISOString(),
            source: "background-price-sync"
          });

        // Update deals record if linked
        if (product.deal_id) {
          const dealUpdate = {
            discounted_price: newPrice,
            updated_at: new Date().toISOString()
          };
          if (newOriginalPrice != null && newOriginalPrice >= newPrice) {
            dealUpdate.original_price = newOriginalPrice;
            dealUpdate.discount_percentage = Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100);
          }
          await supabaseAdmin
            .from("deals")
            .update(dealUpdate)
            .eq("id", product.deal_id);

          // Check active price alerts for this deal
          const triggeredCount = await checkAndTriggerAlerts(product.deal_id, newPrice, product.title || "Product");
          alertsTriggeredCount += triggeredCount;
        }
      } else {
        // Update last checked timestamp even if price couldn't be parsed
        await supabaseAdmin
          .from("tracked_products")
          .update({ last_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", product.id);
      }
    } catch (err) {
      errorCount += 1;
      console.warn(`[sync-price-tracking] error updating ${product.id} (${url}):`, err.message || err);
    }
  }

  const summary = {
    requestsProcessed,
    checkedCount,
    priceUpdatedCount,
    alertsTriggeredCount,
    errorCount,
    timestamp: new Date().toISOString()
  };

  console.log("\n=== Price Tracking Sync Finished ===");
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

async function getPendingRequests(limit = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from("price_tracking_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

async function getTrackedProducts(limit = 100) {
  try {
    const { data, error } = await supabaseAdmin
      .from("tracked_products")
      .select("*")
      .order("last_checked_at", { ascending: true, nullsFirst: true })
      .limit(limit);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

async function checkAndTriggerAlerts(dealId, currentPrice, productTitle) {
  if (!dealId || !Number.isFinite(currentPrice) || currentPrice <= 0) return 0;
  let triggeredCount = 0;

  try {
    const { data: alerts, error } = await supabaseAdmin
      .from("price_alerts")
      .select("*")
      .eq("deal_id", dealId)
      .eq("is_active", true)
      .eq("is_triggered", false);

    if (error || !alerts || alerts.length === 0) return 0;

    for (const alert of alerts) {
      const targetPrice = Number(alert.target_price);
      if (Number.isFinite(targetPrice) && currentPrice <= targetPrice) {
        triggeredCount += 1;
        await supabaseAdmin
          .from("price_alerts")
          .update({
            is_triggered: true,
            current_price: currentPrice,
            triggered_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", alert.id);

        console.log(`[price-alert] Alert triggered for user ${alert.user_id}! Price ₹${currentPrice} <= Target ₹${targetPrice}`);

        // Insert notification if notifications table exists
        await supabaseAdmin
          .from("notifications")
          .insert({
            user_id: alert.user_id,
            deal_id: dealId,
            type: "PRICE_ALERT",
            title: "Price Drop Alert!",
            message: `Great news! The price for "${productTitle}" dropped to ₹${currentPrice.toLocaleString("en-IN")} (Target was ₹${targetPrice.toLocaleString("en-IN")}).`,
            is_read: false,
            created_at: new Date().toISOString()
          })
          .catch((notifErr) => {
            console.warn("[price-alert] notification insert error:", notifErr.message || notifErr);
          });
      }
    }
  } catch (err) {
    console.warn("[price-alert] checkAndTriggerAlerts error:", err.message || err);
  }

  return triggeredCount;
}

if (require.main === module) {
  syncPriceTracking()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("sync-price-tracking error:", err);
      process.exit(1);
    });
}

module.exports = { syncPriceTracking };
