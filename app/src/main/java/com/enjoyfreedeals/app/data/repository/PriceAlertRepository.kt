package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.supabase.PriceAlertDto
import com.enjoyfreedeals.app.data.supabase.SupabaseConfig
import com.enjoyfreedeals.app.data.supabase.SupabaseDealDataSource

class PriceAlertRepository(@Suppress("unused") private val context: Context) {
    private val supabase = SupabaseDealDataSource()

    suspend fun createPriceAlert(userId: String, productId: String, targetPrice: Double) {
        if (!SupabaseConfig.isConfigured) return
        supabase.createPriceAlert(
            userId = userId,
            productId = productId,
            targetPrice = targetPrice
        )
    }

    suspend fun getUserPriceAlerts(userId: String): List<PriceAlertDto> {
        if (!SupabaseConfig.isConfigured) return emptyList()
        return runCatching {
            supabase.priceAlerts().filter { it.userId == userId }
        }.getOrDefault(emptyList())
    }

    @Suppress("unused")
    suspend fun updatePriceAlert(alertId: String, isActive: Boolean) {
        if (!SupabaseConfig.isConfigured) return
        supabase.updatePriceAlert(alertId, isActive)
    }

    @Suppress("unused")
    suspend fun deletePriceAlert(alertId: String) {
        if (!SupabaseConfig.isConfigured) return
        supabase.deletePriceAlert(alertId)
    }
}
