package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.SharedDealModel
import com.enjoyfreedeals.app.data.model.supabase.NewSharedDealDto
import com.enjoyfreedeals.app.data.model.supabase.SharedDealDto
import com.enjoyfreedeals.app.data.supabase.SupabaseConfig
import com.enjoyfreedeals.app.data.supabase.SupabaseDealDataSource

class SharedDealsRepository(@Suppress("unused") private val context: Context) {
    private val supabase = SupabaseDealDataSource()

    suspend fun recordSharedDeal(userId: String, deal: DealModel, sharePlatform: String? = "android") {
        if (!SupabaseConfig.isConfigured || userId.isBlank() || deal.dealId.isBlank()) return
        runCatching { supabase.recordSharedDeal(deal.toNewSharedDealDto(userId, sharePlatform)) }
    }

    suspend fun getSharedDeals(userId: String): List<SharedDealModel> {
        if (!SupabaseConfig.isConfigured) return emptyList()
        return runCatching {
            supabase.sharedDeals()
                .filter { it.userId == userId }
                .sortedByDescending { it.createdAt.orEmpty() }
                .map { it.toModel() }
        }.getOrDefault(emptyList())
    }

    suspend fun getSharedDealsCount(userId: String): Int =
        getSharedDeals(userId).size
}

private fun DealModel.toNewSharedDealDto(userId: String, sharePlatform: String?): NewSharedDealDto =
    NewSharedDealDto(
        userId = userId,
        dealId = dealId,
        productTitle = title,
        platform = storeName,
        dealPrice = effectivePrice,
        productUrl = redirectUrl,
        imageUrl = displayImageUrl,
        sharePlatform = sharePlatform
    )

private fun SharedDealDto.toModel(): SharedDealModel =
    SharedDealModel(
        id = id,
        userId = userId,
        dealId = dealId,
        productTitle = productTitle.orEmpty(),
        platform = platform.orEmpty(),
        dealPrice = dealPrice ?: 0.0,
        productUrl = productUrl.orEmpty(),
        imageUrl = imageUrl.orEmpty(),
        sharePlatform = sharePlatform,
        sharedTo = sharedTo,
        createdAt = createdAt
    )
