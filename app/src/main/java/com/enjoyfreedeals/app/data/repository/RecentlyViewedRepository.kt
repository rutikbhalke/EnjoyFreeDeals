package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.RecentlyViewedDealModel
import com.enjoyfreedeals.app.data.model.supabase.NewRecentlyViewedDealDto
import com.enjoyfreedeals.app.data.model.supabase.RecentlyViewedDealDto
import com.enjoyfreedeals.app.data.supabase.SupabaseConfig
import com.enjoyfreedeals.app.data.supabase.SupabaseDealDataSource

class RecentlyViewedRepository(@Suppress("unused") private val context: Context) {
    private val supabase = SupabaseDealDataSource()

    suspend fun addRecentlyViewed(userId: String, deal: DealModel) {
        if (!SupabaseConfig.isConfigured || userId.isBlank() || deal.dealId.isBlank()) return
        runCatching { supabase.addRecentlyViewed(deal.toNewRecentlyViewedDealDto(userId)) }
    }

    suspend fun getRecentlyViewed(userId: String): List<RecentlyViewedDealModel> {
        if (!SupabaseConfig.isConfigured) return emptyList()
        return runCatching {
            supabase.recentlyViewedDeals()
                .filter { it.userId == userId }
                .sortedByDescending { it.viewedAt.orEmpty() }
                .map { it.toModel() }
        }.getOrDefault(emptyList())
    }

    suspend fun getRecentlyViewedCount(userId: String): Int =
        getRecentlyViewed(userId).size

    suspend fun clearRecentlyViewed(userId: String) {
        if (!SupabaseConfig.isConfigured) return
        runCatching { supabase.clearRecentlyViewed(userId) }
    }
}

private fun DealModel.toNewRecentlyViewedDealDto(userId: String): NewRecentlyViewedDealDto =
    NewRecentlyViewedDealDto(
        userId = userId,
        dealId = dealId,
        productTitle = title,
        platform = storeName,
        dealPrice = effectivePrice,
        originalPrice = originalPrice,
        discountPercent = discountPercent.toDouble(),
        productUrl = redirectUrl,
        imageUrl = displayImageUrl
    )

private fun RecentlyViewedDealDto.toModel(): RecentlyViewedDealModel =
    RecentlyViewedDealModel(
        id = id,
        userId = userId,
        dealId = dealId,
        productTitle = productTitle.orEmpty(),
        platform = platform.orEmpty(),
        dealPrice = dealPrice ?: 0.0,
        originalPrice = originalPrice,
        discountPercent = discountPercent,
        productUrl = productUrl.orEmpty(),
        imageUrl = imageUrl.orEmpty(),
        viewedAt = viewedAt
    )
