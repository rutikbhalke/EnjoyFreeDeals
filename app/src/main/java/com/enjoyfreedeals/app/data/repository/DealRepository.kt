package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.model.PriceStatsModel
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.data.model.supabase.toDealModel
import com.enjoyfreedeals.app.data.model.supabase.toStorePriceModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import com.enjoyfreedeals.app.data.remote.dataArray
import com.enjoyfreedeals.app.data.remote.dataObject
import com.enjoyfreedeals.app.data.remote.toDealModel
import com.enjoyfreedeals.app.data.remote.toJsonObjects
import com.enjoyfreedeals.app.data.remote.toPricePointModel
import com.enjoyfreedeals.app.data.supabase.SupabaseConfig
import com.enjoyfreedeals.app.data.supabase.SupabaseDealDataSource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import org.json.JSONObject
import java.net.URLEncoder

class DealRepository(private val context: Context) {
    private val backendClient = BackendClient()
    private val supabase = SupabaseDealDataSource()
    private val userRepository = UserRepository(context)

    fun getAllActiveDeals(page: Int = 1, limit: Int = DEFAULT_PAGE_SIZE): Flow<List<DealModel>> = flow {
        emit(loadDeals("/api/deals?limit=$limit&page=$page").getOrThrow())
    }

    fun getDealsByCategory(categoryId: String, page: Int = 1, limit: Int = DEFAULT_PAGE_SIZE): Flow<List<DealModel>> = flow {
        val endpoint = "/api/deals?limit=$limit&page=$page&category=${categoryId.urlEncode()}"
        emit(loadDeals(endpoint).getOrThrow())
    }

    fun getActiveDeals(): Flow<List<DealModel>> = flow {
        emit(refreshDeals())
    }

    suspend fun refreshDeals(): List<DealModel> =
        loadSupabaseDeals().getOrElse {
            loadDeals("/api/deals?limit=$DEFAULT_PAGE_SIZE&page=1").getOrThrow()
        }

    suspend fun getDealByOfferId(offerId: String): DealModel? {
        val safeOfferId = offerId.trim()
        if (safeOfferId.isBlank()) return null

        return loadSupabaseDeals().getOrNull()
            ?.firstOrNull { deal ->
                deal.dealId == safeOfferId || deal.productId == safeOfferId
            }
            ?: loadDeal(safeOfferId).getOrNull()
    }

    fun getPriceHistory(dealId: String): Flow<List<PricePointModel>> = flow {
        val history =
            backendClient.get("/api/deals/${dealId.urlEncode()}/price-history", AuthSessionStore.accessToken(context))
                .dataArray()
                .toJsonObjects()
                .map { it.toPricePointModel(dealId) }
        emit(history)
    }

    fun getSavedDeals(): Flow<List<DealModel>> = userRepository.getSavedDeals()

    fun getSharedDeals(): Flow<List<DealModel>> = userRepository.getSharedDeals()

    suspend fun saveDeal(dealId: String) {
        userRepository.addSavedDeal(dealId)
    }

    suspend fun removeSavedDeal(dealId: String) {
        userRepository.removeSavedDeal(dealId)
    }

    suspend fun shareDeal(dealId: String) {
        userRepository.addSharedDeal(dealId)
    }

    suspend fun enablePriceDropAlert(deal: DealModel, targetPrice: Double) {
        val userId = userRepository.getCurrentUserId()
        backendClient.post(
            "/api/price-alerts",
            JSONObject()
                .put("userId", userId)
                .put("dealId", deal.dealId)
                .put("targetPrice", targetPrice),
            AuthSessionStore.accessToken(context)
        )
        userRepository.addPriceDropAlert(deal.dealId, targetPrice)
    }

    suspend fun disablePriceDropAlert(dealId: String) {
        val userId = userRepository.getCurrentUserId()
        if (userId.isNotBlank()) {
            runCatching {
                backendClient.delete(
                    "/api/price-alerts/${userId.urlEncode()}/${dealId.urlEncode()}",
                    AuthSessionStore.accessToken(context)
                )
            }
        }
        userRepository.removePriceDropAlert(dealId)
    }

    fun createPriceDropNotificationIfNeeded(
        deal: DealModel,
        history: List<PricePointModel>,
        targetPrice: Double
    ): Boolean =
        shouldCreatePriceDropNotification(deal, history, targetPrice)

    private suspend fun loadDeals(endpoint: String): Result<List<DealModel>> = runCatching {
        backendClient.get(endpoint, AuthSessionStore.accessToken(context))
            .dataArray()
            .toJsonObjects()
            .map { it.toDealModel() }
            .filter { it.isActive && it.expiryDate > System.currentTimeMillis() }
    }

    private suspend fun loadDeal(dealId: String): Result<DealModel?> = runCatching {
        backendClient.get("/api/deals/${dealId.urlEncode()}", AuthSessionStore.accessToken(context))
            .dataObject()
            .takeIf { it.length() > 0 }
            ?.toDealModel()
            ?.takeIf { it.isActive && it.expiryDate > System.currentTimeMillis() }
    }

    private suspend fun loadSupabaseDeals(): Result<List<DealModel>> = runCatching {
        if (!SupabaseConfig.isConfigured) error("Supabase is not configured")

        val comparisonsByProduct = supabase.priceComparison()
            .groupBy { it.productId }
            .mapValues { (_, comparisons) ->
                comparisons.map { it.toStorePriceModel() }
                    .sortedWith(compareBy<StorePriceModel> { !it.available }.thenBy { it.price })
            }
        val statsByProduct = supabase.productPriceStats().associateBy { it.productId }

        supabase.activeDeals()
            .map { deal ->
                val productId = deal.productId.ifBlank { deal.offerId }
                deal.toDealModel(
                    comparisonPrices = comparisonsByProduct[productId].orEmpty(),
                    priceStats = statsByProduct[productId]
                )
            }
            .filter { it.isActive && it.expiryDate > System.currentTimeMillis() }
    }

    private fun String.urlEncode(): String =
        URLEncoder.encode(this, Charsets.UTF_8.name())

    companion object {
        const val DEFAULT_PAGE_SIZE = 20

        fun buildPriceHistoryRecord(
            deal: DealModel,
            history: List<PricePointModel> = emptyList(),
            checkedAt: Long = System.currentTimeMillis()
        ): PricePointModel {
            val previousPrice = history.maxByOrNull { it.recordedAt }?.price ?: deal.effectivePrice
            val provisional = PricePointModel(
                id = "${deal.dealId}-$checkedAt",
                productId = deal.productId.ifBlank { deal.dealId },
                storeName = deal.storeName,
                productUrl = deal.productUrl,
                affiliateUrl = deal.redirectUrl,
                priceAmount = deal.effectivePrice,
                currentPrice = deal.effectivePrice,
                originalPrice = deal.originalPrice,
                discountPercentage = deal.discountPercent,
                priceDropAmount = (previousPrice - deal.effectivePrice).coerceAtLeast(0.0),
                checkedAt = checkedAt,
                priceCheckedAt = checkedAt,
                createdAt = checkedAt,
                updatedAt = checkedAt,
                source = "backend"
            )
            val stats = calculatePriceStats(deal, history + provisional)
            return provisional.copy(
                lowestPrice = stats.lowestPrice,
                highestPrice = stats.highestPrice,
                averagePrice = stats.averagePrice
            )
        }

        fun suggestedAlertPrice(deal: DealModel, history: List<PricePointModel>): Double {
            val stats = calculatePriceStats(deal, history)
            val tenPercentLower = deal.effectivePrice * 0.90
            val nearLowest = if (stats.lowestPrice > 0.0) stats.lowestPrice * 1.02 else tenPercentLower
            val belowAverage = if (stats.averagePrice > 0.0) stats.averagePrice * 0.92 else tenPercentLower
            return minOf(tenPercentLower, nearLowest, belowAverage).coerceAtLeast(0.0)
        }

        fun shouldCreatePriceDropNotification(
            deal: DealModel,
            history: List<PricePointModel>,
            targetPrice: Double? = null
        ): Boolean {
            val prices = history.map { it.price }.filter { it >= 0.0 }
            val previousLowest = prices.minOrNull()
            val stats = calculatePriceStats(deal, history)
            val hitsTarget = targetPrice?.let { deal.effectivePrice <= it } ?: false
            val reachesNewLowest = previousLowest != null && deal.effectivePrice < previousLowest
            val belowAverage = stats.averagePrice > 0.0 && deal.effectivePrice < stats.averagePrice
            val deepDiscount = deal.discountPercent > 50
            return hitsTarget || reachesNewLowest || belowAverage || deepDiscount
        }

        fun calculatePriceStats(
            deal: DealModel,
            history: List<PricePointModel>
        ): PriceStatsModel {
            val prices = history.map { it.price }.filter { it >= 0.0 }.ifEmpty { listOf(deal.effectivePrice) }
            val current = deal.effectivePrice
            val average = prices.average()
            val highest = prices.maxOrNull() ?: current
            val lowest = prices.minOrNull() ?: current
            val dropPercent = if (average > 0.0 && current < average) {
                (((average - current) / average) * 100).toInt()
            } else {
                0
            }
            return PriceStatsModel(
                currentPrice = current,
                averagePrice = average,
                highestPrice = highest,
                lowestPrice = lowest,
                dropFromAveragePercent = dropPercent,
                isLowestPriceNow = current <= lowest
            )
        }

        fun filterAndSortDeals(
            deals: List<DealModel>,
            query: String = "",
            storeFilter: String = "All",
            sortOption: String = "Newest Deals"
        ): List<DealModel> {
            val filtered = deals.filter { deal ->
                val matchesStore = storeFilter == "All" || deal.storeName.equals(storeFilter, ignoreCase = true)
                val q = query.trim()
                val matchesQuery = q.isBlank() ||
                    deal.title.contains(q, ignoreCase = true) ||
                    deal.storeName.contains(q, ignoreCase = true) ||
                    deal.categoryName.contains(q, ignoreCase = true) ||
                    deal.dealType.contains(q, ignoreCase = true) ||
                    deal.couponCode.contains(q, ignoreCase = true)
                matchesStore && matchesQuery
            }

            return when (sortOption) {
                "Highest Discount" -> filtered.sortedByDescending { it.discountPercent }
                "Lowest Price" -> filtered.sortedBy { it.effectivePrice }
                "Popular Deals" -> filtered.sortedByDescending { it.savedCount + it.shareCount }
                "Free Deals" -> filtered.sortedWith(compareByDescending<DealModel> { it.isFreeDeal }.thenBy { it.effectivePrice })
                "Expiring Soon" -> filtered.sortedBy { it.expiryDate }
                "Latest Deals" -> filtered.sortedByDescending { it.createdAt }
                else -> filtered.sortedByDescending { it.createdAt }
            }
        }
    }
}
