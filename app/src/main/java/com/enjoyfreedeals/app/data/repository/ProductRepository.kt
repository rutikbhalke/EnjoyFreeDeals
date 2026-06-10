package com.enjoyfreedeals.app.data.repository

import android.content.Context
import android.util.Log
import com.enjoyfreedeals.app.data.mock.MockDeals
import com.enjoyfreedeals.app.data.mock.MockPriceHistory
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.model.PriceStatsModel
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import com.enjoyfreedeals.app.data.remote.toJsonObjects
import com.enjoyfreedeals.app.data.remote.toStorePriceModel
import com.enjoyfreedeals.app.data.model.supabase.ProductPriceStatsDto
import com.enjoyfreedeals.app.data.model.supabase.toPricePointModel
import com.enjoyfreedeals.app.data.model.supabase.toPriceStatsModel
import com.enjoyfreedeals.app.data.model.supabase.toStorePriceModel as toSupabaseStorePriceModel
import com.enjoyfreedeals.app.data.supabase.SupabaseConfig
import com.enjoyfreedeals.app.data.supabase.SupabaseDealDataSource
import java.net.URLEncoder

class ProductRepository(@Suppress("unused") private val context: Context) {
    private val supabase = SupabaseDealDataSource()
    private val backend = BackendClient()

    suspend fun getPriceComparison(productId: String): List<StorePriceModel> {
        val fallback = mockDeal(productId)?.comparisonPrices.orEmpty()
        val backendPrices = runCatching {
            val encodedProductId = URLEncoder.encode(productId, Charsets.UTF_8.name())
            Log.d("PriceComparison", "GET /api/compare-price?productId=$encodedProductId")
            val response = backend.get("/api/compare-price?productId=$encodedProductId")
            val prices = response.optJSONArray("prices")
                ?.toJsonObjects()
                ?.map { it.toStorePriceModel() }
                ?.sortedWith(compareBy<StorePriceModel> { !it.available }.thenBy { it.price })
                .orEmpty()
            Log.d("PriceComparison", "Backend rows=${prices.size}")
            prices
        }.onFailure {
            Log.w("PriceComparison", "Backend failed, using fallback data", it)
        }.getOrDefault(emptyList())
        if (backendPrices.isNotEmpty()) return backendPrices

        Log.d("PriceComparison", "Fallback rows used")
        if (!SupabaseConfig.isConfigured) return fallback.ifEmpty { sampleComparison(productId) }
        return runCatching {
            supabase.priceComparison()
                .filter { it.productId == productId }
                .map { it.toSupabaseStorePriceModel() }
                .sortedWith(compareBy<StorePriceModel> { !it.available }.thenBy { it.price })
        }.getOrDefault(emptyList()).ifEmpty { fallback.ifEmpty { sampleComparison(productId) } }
    }

    suspend fun getPriceStats(productId: String): ProductPriceStatsDto? {
        if (!SupabaseConfig.isConfigured) return null
        return runCatching {
            supabase.productPriceStats().firstOrNull { it.productId == productId }
        }.getOrNull()
    }

    suspend fun getPriceHistory(productId: String): List<PricePointModel> {
        val fallback = MockPriceHistory.priceHistory[productId].orEmpty()
        if (!SupabaseConfig.isConfigured) return fallback
        return runCatching {
            supabase.priceHistory()
                .filter { it.productId == productId }
                .map { it.toPricePointModel() }
                .sortedBy { it.recordedAt }
        }.getOrDefault(emptyList())
    }

    suspend fun getPriceStatsModel(productId: String, currentPrice: Double): PriceStatsModel? =
        getPriceStats(productId)?.toPriceStatsModel(currentPrice)

    private fun mockDeal(productId: String) =
        MockDeals.deals.firstOrNull { it.dealId == productId || it.productId == productId }

    private fun sampleComparison(productId: String): List<StorePriceModel> {
        val title = mockDeal(productId)?.title.orEmpty().lowercase()
        val prices = when {
            "watch" in title -> listOf("Noise" to 1299.0, "Flipkart" to 1399.0, "Amazon" to 1499.0, "TataCliq" to 1599.0, "Reliance Digital" to 1599.0, "Croma" to 1699.0)
            "mobile" in title || "phone" in title -> listOf("Flipkart" to 12499.0, "JioMart" to 12899.0, "Reliance Digital" to 12949.0, "Amazon" to 12999.0, "Croma" to 13299.0, "TataCliq" to 13499.0)
            else -> listOf("Meesho" to 899.0, "Flipkart" to 949.0, "Amazon" to 999.0, "Croma" to 1049.0, "Boat" to 1099.0, "Reliance Digital" to 1199.0)
        }
        val lowest = prices.minOf { it.second }
        return prices.map { (platform, price) ->
            StorePriceModel(
                platform = platform,
                price = price,
                originalPrice = price * 2,
                discountPercent = 50.0,
                productUrl = platformUrl(platform),
                affiliateUrl = platformUrl(platform),
                available = true,
                deliveryInfo = "See store",
                isLowestPrice = price == lowest,
                storeLogoUrl = platformLogo(platform)
            )
        }
    }

    private fun platformUrl(platform: String): String = when (platform.lowercase()) {
        "amazon" -> "https://www.amazon.in/dp/B0XXXXXXX"
        "flipkart" -> "https://www.flipkart.com/sample-product/p/itmxxxxxxx"
        "meesho" -> "https://www.meesho.com/sample-product/p/demoearbuds1"
        "croma" -> "https://www.croma.com/sample-product/p/300002"
        "boat" -> "https://www.boat-lifestyle.com/products/sample-product"
        "noise" -> "https://www.gonoise.com/products/sample-smart-watch"
        "tatacliq" -> "https://www.tatacliq.com/sample-smart-watch/p-mp000000000"
        "reliance digital" -> "https://www.reliancedigital.in/sample-product/p/491000002"
        "jiomart" -> "https://www.jiomart.com/p/electronics/sample-product/590000000"
        else -> "https://enjoyfreedeals-web.vercel.app/deals"
    }

    private fun platformLogo(platform: String): String = when (platform.lowercase()) {
        "amazon" -> "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"
        "flipkart" -> "https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/fk-logo-pre-login-3a7a30.svg"
        "meesho" -> "https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo_Full.png"
        "croma" -> "https://logo.clearbit.com/croma.com"
        "boat" -> "https://logo.clearbit.com/boat-lifestyle.com"
        "noise" -> "https://logo.clearbit.com/gonoise.com"
        "tatacliq" -> "https://logo.clearbit.com/tatacliq.com"
        "reliance digital" -> "https://logo.clearbit.com/reliancedigital.in"
        "jiomart" -> "https://logo.clearbit.com/jiomart.com"
        else -> ""
    }
}
