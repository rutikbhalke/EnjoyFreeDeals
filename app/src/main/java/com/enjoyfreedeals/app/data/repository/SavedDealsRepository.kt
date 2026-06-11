@file:Suppress("unused")

package com.enjoyfreedeals.app.data.repository

import android.content.Context
import android.util.Log
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.SavedDealModel
import com.enjoyfreedeals.app.data.model.supabase.NewSavedDealDto
import com.enjoyfreedeals.app.data.model.supabase.SavedDealDto
import com.enjoyfreedeals.app.data.supabase.SupabaseConfig
import com.enjoyfreedeals.app.data.supabase.SupabaseDealDataSource

class SavedDealsRepository(@Suppress("unused") private val context: Context) {
    private val supabase = SupabaseDealDataSource()

    suspend fun getSavedDeals(userId: String): Result<List<SavedDealModel>> {
        if (!SupabaseConfig.isConfigured) return Result.success(emptyList())
        Log.d(TAG, "Fetching with userId=$userId")
        return runCatching {
            supabase.savedDeals(userId)
                .sortedByDescending { it.createdAt.orEmpty() }
                .map { it.toModel() }
        }.onFailure { error ->
            Log.e(TAG, "Failed fetching saved deals with userId=$userId", error)
        }
    }

    suspend fun getSavedDealsCount(userId: String): Result<Int> =
        getSavedDeals(userId).map { it.size }

    suspend fun saveDeal(userId: String, deal: DealModel): Result<Unit> {
        if (!SupabaseConfig.isConfigured || userId.isBlank() || deal.dealId.isBlank()) return Result.success(Unit)
        Log.d(TAG, "Saving with userId=$userId")
        return runCatching { supabase.saveDeal(deal.toNewSavedDealDto(userId)) }
            .onFailure { error -> Log.e(TAG, "Failed saving deal=${deal.dealId} with userId=$userId", error) }
    }

    suspend fun saveDeal(userId: String, offerId: String): Result<Unit> {
        if (!SupabaseConfig.isConfigured || userId.isBlank() || offerId.isBlank()) return Result.success(Unit)
        if (isDealSaved(userId, offerId).getOrDefault(false)) return Result.success(Unit)
        Log.d(TAG, "Saving with userId=$userId")
        return runCatching { supabase.saveDeal(userId, offerId) }
            .onFailure { error -> Log.e(TAG, "Failed saving deal=$offerId with userId=$userId", error) }
    }

    suspend fun removeSavedDeal(userId: String, dealId: String): Result<Unit> {
        if (!SupabaseConfig.isConfigured || userId.isBlank() || dealId.isBlank()) return Result.success(Unit)
        Log.d(TAG, "Removing with userId=$userId")
        return runCatching { supabase.removeSavedDeal(userId, dealId) }
            .onFailure { error -> Log.e(TAG, "Failed removing deal=$dealId with userId=$userId", error) }
    }

    suspend fun isDealSaved(userId: String, dealId: String): Result<Boolean> =
        getSavedDeals(userId).map { savedDeals -> savedDeals.any { it.dealId == dealId } }

    private companion object {
        const val TAG = "SavedDeals"
    }
}

private fun DealModel.toNewSavedDealDto(userId: String): NewSavedDealDto =
    NewSavedDealDto(
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

private fun SavedDealDto.toModel(): SavedDealModel =
    SavedDealModel(
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
        createdAt = createdAt
    )
