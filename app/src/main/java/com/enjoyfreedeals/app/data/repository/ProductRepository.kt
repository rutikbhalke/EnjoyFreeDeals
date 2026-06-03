package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.mock.MockDeals
import com.enjoyfreedeals.app.data.mock.MockPriceHistory
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.model.PriceStatsModel
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.data.model.supabase.ProductPriceStatsDto
import com.enjoyfreedeals.app.data.model.supabase.toPricePointModel
import com.enjoyfreedeals.app.data.model.supabase.toPriceStatsModel
import com.enjoyfreedeals.app.data.model.supabase.toStorePriceModel
import com.enjoyfreedeals.app.data.supabase.SupabaseConfig
import com.enjoyfreedeals.app.data.supabase.SupabaseDealDataSource

class ProductRepository(@Suppress("unused") private val context: Context) {
    private val supabase = SupabaseDealDataSource()

    suspend fun getPriceComparison(productId: String): List<StorePriceModel> {
        val fallback = mockDeal(productId)?.comparisonPrices.orEmpty()
        if (!SupabaseConfig.isConfigured) return fallback
        return runCatching {
            supabase.priceComparison()
                .filter { it.productId == productId }
                .map { it.toStorePriceModel() }
                .sortedWith(compareBy<StorePriceModel> { !it.available }.thenBy { it.price })
        }.getOrDefault(emptyList())
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
}
