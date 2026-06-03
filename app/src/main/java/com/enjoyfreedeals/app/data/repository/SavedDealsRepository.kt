@file:Suppress("unused")

package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.supabase.SavedDealDto
import com.enjoyfreedeals.app.data.supabase.SupabaseConfig
import com.enjoyfreedeals.app.data.supabase.SupabaseDealDataSource

class SavedDealsRepository(@Suppress("unused") private val context: Context) {
    private val supabase = SupabaseDealDataSource()

    suspend fun getSavedDeals(userId: String): List<SavedDealDto> {
        if (!SupabaseConfig.isConfigured) return emptyList()
        return runCatching {
            supabase.savedDeals().filter { it.userId == userId }
        }.getOrDefault(emptyList())
    }

    suspend fun saveDeal(userId: String, offerId: String) {
        if (!SupabaseConfig.isConfigured || isDealSaved(userId, offerId)) return
        supabase.saveDeal(userId, offerId)
    }

    suspend fun removeSavedDeal(userId: String, offerId: String) {
        if (!SupabaseConfig.isConfigured) return
        supabase.removeSavedDeal(userId, offerId)
    }

    suspend fun isDealSaved(userId: String, offerId: String): Boolean =
        getSavedDeals(userId).any { it.offerId == offerId }
}
