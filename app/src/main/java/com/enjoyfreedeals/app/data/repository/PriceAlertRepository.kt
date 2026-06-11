package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.MobilePriceAlertModel
import com.enjoyfreedeals.app.data.model.PriceAlertModel
import com.enjoyfreedeals.app.data.model.supabase.NewPriceAlertDto
import com.enjoyfreedeals.app.data.model.supabase.PriceAlertDto
import com.enjoyfreedeals.app.data.supabase.SupabaseConfig
import com.enjoyfreedeals.app.data.supabase.SupabaseDealDataSource

class PriceAlertRepository(@Suppress("unused") private val context: Context) {
    private val supabase = SupabaseDealDataSource()

    suspend fun createPriceAlert(userId: String, deal: DealModel, targetPrice: Double) {
        if (!SupabaseConfig.isConfigured || userId.isBlank() || deal.dealId.isBlank()) return
        runCatching { supabase.createPriceAlert(deal.toNewPriceAlertDto(userId, targetPrice)) }
    }

    suspend fun createPriceAlert(userId: String, productId: String, targetPrice: Double) {
        if (!SupabaseConfig.isConfigured) return
        runCatching {
            supabase.createPriceAlert(
                userId = userId,
                productId = productId,
                targetPrice = targetPrice
            )
        }
    }

    suspend fun getPriceAlerts(userId: String): List<PriceAlertModel> {
        if (!SupabaseConfig.isConfigured) return emptyList()
        return runCatching {
            supabase.priceAlerts()
                .filter { it.userId == userId }
                .sortedByDescending { it.createdAt.orEmpty() }
                .map { it.toPriceAlertModel() }
        }.getOrDefault(emptyList())
    }

    suspend fun getPriceAlertsCount(userId: String): Int =
        getPriceAlerts(userId).size

    suspend fun getUserPriceAlerts(userId: String): List<PriceAlertDto> {
        if (!SupabaseConfig.isConfigured) return emptyList()
        return runCatching { supabase.priceAlerts().filter { it.userId == userId } }.getOrDefault(emptyList())
    }

    suspend fun updatePriceAlert(userId: String, dealId: String, targetPrice: Double) {
        if (!SupabaseConfig.isConfigured) return
        runCatching { supabase.updatePriceAlert(userId, dealId, targetPrice) }
    }

    suspend fun removePriceAlert(userId: String, dealId: String) {
        if (!SupabaseConfig.isConfigured) return
        runCatching { supabase.deletePriceAlert(userId, dealId) }
    }

    suspend fun checkPriceAlertStatus(userId: String, dealId: String): MobilePriceAlertModel? =
        getUserPriceAlerts(userId).firstOrNull { it.dealId == dealId }?.toMobileModel()

    @Suppress("unused")
    suspend fun updatePriceAlert(alertId: String, isActive: Boolean) {
        if (!SupabaseConfig.isConfigured) return
        runCatching { supabase.updatePriceAlert(alertId, isActive) }
    }

    @Suppress("unused")
    suspend fun deletePriceAlert(alertId: String) {
        if (!SupabaseConfig.isConfigured) return
        runCatching { supabase.deletePriceAlert(alertId) }
    }
}

private fun DealModel.toNewPriceAlertDto(userId: String, targetPrice: Double): NewPriceAlertDto =
    NewPriceAlertDto(
        userId = userId,
        dealId = dealId,
        productTitle = title,
        platform = storeName,
        currentPrice = effectivePrice,
        targetPrice = targetPrice,
        originalPrice = originalPrice,
        productUrl = redirectUrl,
        imageUrl = displayImageUrl,
        isActive = true
    )

private fun PriceAlertDto.toPriceAlertModel(): PriceAlertModel =
    PriceAlertModel(
        id = id,
        userId = userId,
        dealId = dealId,
        productTitle = productTitle.orEmpty(),
        platform = platform.orEmpty(),
        currentPrice = currentPrice ?: 0.0,
        targetPrice = targetPrice,
        originalPrice = originalPrice,
        productUrl = productUrl.orEmpty(),
        imageUrl = imageUrl.orEmpty(),
        isActive = isActive,
        isTriggered = isTriggered,
        triggeredAt = triggeredAt,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

private fun PriceAlertDto.toMobileModel(): MobilePriceAlertModel =
    MobilePriceAlertModel(
        id = id,
        userId = userId,
        dealId = dealId,
        productTitle = productTitle.orEmpty(),
        platform = platform.orEmpty(),
        currentPrice = currentPrice ?: 0.0,
        targetPrice = targetPrice,
        originalPrice = originalPrice,
        productUrl = productUrl.orEmpty(),
        imageUrl = imageUrl.orEmpty(),
        isActive = isActive,
        isTriggered = isTriggered,
        triggeredAt = triggeredAt,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
