package com.enjoyfreedeals.app.data.supabase

import com.enjoyfreedeals.app.data.model.supabase.ActiveDealDto
import com.enjoyfreedeals.app.data.model.supabase.NewPriceAlertDto
import com.enjoyfreedeals.app.data.model.supabase.NewRecentlyViewedDealDto
import com.enjoyfreedeals.app.data.model.supabase.NewSavedDealDto
import com.enjoyfreedeals.app.data.model.supabase.NewSharedDealDto
import com.enjoyfreedeals.app.data.model.supabase.PriceAlertDto
import com.enjoyfreedeals.app.data.model.supabase.PriceComparisonDto
import com.enjoyfreedeals.app.data.model.supabase.PriceHistoryDto
import com.enjoyfreedeals.app.data.model.supabase.ProductPriceStatsDto
import com.enjoyfreedeals.app.data.model.supabase.RecentlyViewedDealDto
import com.enjoyfreedeals.app.data.model.supabase.SavedDealDto
import com.enjoyfreedeals.app.data.model.supabase.SharedDealDto
import com.enjoyfreedeals.app.data.model.supabase.UpdatePriceAlertDto
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class SupabaseDealDataSource {
    private val client get() = SupabaseClientProvider.client

    suspend fun activeDeals(): List<ActiveDealDto> =
        client.from("active_deals").select().decodeList<ActiveDealDto>()

    suspend fun priceComparison(): List<PriceComparisonDto> =
        client.from("price_comparison").select().decodeList<PriceComparisonDto>()

    suspend fun productPriceStats(): List<ProductPriceStatsDto> =
        client.from("product_price_stats").select().decodeList<ProductPriceStatsDto>()

    suspend fun priceHistory(): List<PriceHistoryDto> =
        client.from("price_history").select().decodeList<PriceHistoryDto>()

    suspend fun savedDeals(): List<SavedDealDto> =
        client.from("saved_deals").select().decodeList<SavedDealDto>()

    suspend fun savedDeals(userId: String): List<SavedDealDto> =
        client.from("saved_deals").select {
            filter { eq("user_id", userId) }
        }.decodeList<SavedDealDto>()

    suspend fun saveDeal(userId: String, offerId: String) {
        client.from("saved_deals").insert(NewSavedDealDto(userId = userId, dealId = offerId))
    }

    suspend fun saveDeal(deal: NewSavedDealDto) {
        removeSavedDeal(deal.userId, deal.dealId)
        client.from("saved_deals").insert(deal)
    }

    suspend fun removeSavedDeal(userId: String, offerId: String) {
        client.from("saved_deals").delete {
            filter {
                eq("user_id", userId)
                eq("deal_id", offerId)
            }
        }
    }

    suspend fun priceAlerts(): List<PriceAlertDto> =
        client.from("price_alerts").select().decodeList<PriceAlertDto>()

    suspend fun createPriceAlert(userId: String, productId: String, targetPrice: Double) {
        client.from("price_alerts").insert(
            NewPriceAlertDto(
                userId = userId,
                dealId = productId,
                targetPrice = targetPrice
            )
        )
    }

    suspend fun createPriceAlert(alert: NewPriceAlertDto) {
        deletePriceAlert(alert.userId, alert.dealId)
        client.from("price_alerts").insert(alert)
    }

    suspend fun updatePriceAlert(alertId: String, isActive: Boolean) {
        client.from("price_alerts").update(UpdatePriceAlertDto(isActive = isActive)) {
            filter { eq("id", alertId) }
        }
    }

    suspend fun updatePriceAlert(userId: String, dealId: String, targetPrice: Double) {
        client.from("price_alerts").update(
            UpdatePriceAlertDto(
                targetPrice = targetPrice
            )
        ) {
            filter {
                eq("user_id", userId)
                eq("deal_id", dealId)
            }
        }
    }

    suspend fun deletePriceAlert(alertId: String) {
        client.from("price_alerts").delete {
            filter { eq("id", alertId) }
        }
    }

    suspend fun deletePriceAlert(userId: String, dealId: String) {
        client.from("price_alerts").delete {
            filter {
                eq("user_id", userId)
                eq("deal_id", dealId)
            }
        }
    }

    suspend fun sharedDeals(): List<SharedDealDto> =
        client.from("shared_deals").select().decodeList<SharedDealDto>()

    suspend fun recordSharedDeal(deal: NewSharedDealDto) {
        client.from("shared_deals").insert(deal)
    }

    suspend fun recentlyViewedDeals(): List<RecentlyViewedDealDto> =
        client.from("recently_viewed_deals").select().decodeList<RecentlyViewedDealDto>()

    suspend fun addRecentlyViewed(deal: NewRecentlyViewedDealDto) {
        client.from("recently_viewed_deals").delete {
            filter {
                eq("user_id", deal.userId)
                eq("deal_id", deal.dealId)
            }
        }
        client.from("recently_viewed_deals").insert(deal)
    }

    suspend fun clearRecentlyViewed(userId: String) {
        client.from("recently_viewed_deals").delete {
            filter { eq("user_id", userId) }
        }
    }

    @Suppress("unused")
    fun productOffersChanges(scope: CoroutineScope): Flow<Unit> = callbackFlow {
        if (!SupabaseConfig.isConfigured) {
            close()
            return@callbackFlow
        }
        val channel = client.channel("product-offers")
        val collector = channel
            .postgresChangeFlow<PostgresAction>(schema = "public") {
                table = "product_offers"
            }
            .onEach { trySend(Unit) }
            .launchIn(scope)
        channel.subscribe()
        awaitClose {
            collector.cancel()
            scope.launch { runCatching { channel.unsubscribe() } }
        }
    }
}
