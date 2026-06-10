package com.enjoyfreedeals.app.data.repository

import android.content.Context
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
            val response = backend.get("/api/compare-price?productId=$encodedProductId")
            response.optJSONArray("prices")
                ?.toJsonObjects()
                ?.map { it.toStorePriceModel() }
                ?.sortedWith(compareBy<StorePriceModel> { !it.available }.thenBy { it.price })
                .orEmpty()
        }.getOrDefault(emptyList())
        if (backendPrices.isNotEmpty()) return backendPrices

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
            "watch" in title -> listOf("Amazon" to 1499.0, "Flipkart" to 1399.0, "TataCliq" to 1599.0, "Croma" to 1699.0)
            "mobile" in title || "phone" in title -> listOf("Amazon" to 12999.0, "Flipkart" to 12499.0, "Croma" to 13299.0, "TataCliq" to 13499.0)
            else -> listOf("Amazon" to 999.0, "Flipkart" to 949.0, "Meesho" to 899.0, "Croma" to 1049.0)
        }
        val lowest = prices.minOf { it.second }
        return prices.map { (platform, price) ->
            StorePriceModel(
                platform = platform,
                price = price,
                originalPrice = price * 2,
                discountPercent = 50.0,
                productUrl = "",
                affiliateUrl = "",
                available = true,
                deliveryInfo = "See store",
                isLowestPrice = price == lowest
            )
        }
    }
}
