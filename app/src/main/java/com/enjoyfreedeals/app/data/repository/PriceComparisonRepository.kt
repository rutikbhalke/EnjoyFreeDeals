package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.PriceComparisonModel
import com.enjoyfreedeals.app.data.model.PriceComparisonProductModel
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import com.enjoyfreedeals.app.data.remote.dataArray
import com.enjoyfreedeals.app.data.remote.toJsonObjects
import com.enjoyfreedeals.app.data.remote.toPriceComparisonProductModel
import com.enjoyfreedeals.app.data.remote.toStorePriceModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.net.URLEncoder

class PriceComparisonRepository(private val context: Context) {
    private val backendClient = BackendClient()

    fun getPriceComparisons(): Flow<List<PriceComparisonProductModel>> = flow {
        emit(loadComparisons().getOrThrow())
    }

    suspend fun getPriceComparison(productId: String): List<StorePriceModel> =
        loadComparison(productId).getOrDefault(sampleComparison())

    suspend fun getPriceComparisonResult(productId: String): Result<List<PriceComparisonModel>> =
        loadComparison(productId).map { prices ->
            prices.mapIndexed { index, price ->
                PriceComparisonModel(
                    id = "$productId-${price.platform.ifBlank { index.toString() }}",
                    productId = productId,
                    platform = price.platform,
                    platformLogoUrl = price.storeLogoUrl.takeIf { it.isNotBlank() },
                    productUrl = price.redirectUrl,
                    price = price.price,
                    originalPrice = price.originalPrice,
                    discountPercent = price.discountPercent,
                    couponCode = price.couponCode.takeIf { it.isNotBlank() },
                    deliveryCharge = price.deliveryCharge,
                    rating = price.rating,
                    reviewCount = price.reviewCount,
                    isLowestPrice = price.isLowestPrice,
                    isAvailable = price.available,
                    lastCheckedAt = price.lastUpdated.toString()
                )
            }
        }

    suspend fun getLowestPrice(productId: String): StorePriceModel? =
        getPriceComparison(productId).filter { it.available }.minByOrNull { it.price }

    suspend fun refreshPriceComparison(productId: String): List<StorePriceModel> =
        getPriceComparison(productId)

    private suspend fun loadComparisons(): Result<List<PriceComparisonProductModel>> = runCatching {
        backendClient.get("/api/price-comparisons", AuthSessionStore.accessToken(context))
            .dataArray()
            .toJsonObjects()
            .map { it.toPriceComparisonProductModel() }
    }

    private suspend fun loadComparison(productId: String): Result<List<StorePriceModel>> = runCatching {
        val encodedProductId = URLEncoder.encode(productId, Charsets.UTF_8.name())
        backendClient.get("/api/compare-price?productId=$encodedProductId", AuthSessionStore.accessToken(context))
            .optJSONArray("prices")
            ?.toJsonObjects()
            ?.map { it.toStorePriceModel() }
            ?.sortedWith(compareBy<StorePriceModel> { !it.available }.thenBy { it.price })
            .orEmpty()
    }

    private fun sampleComparison(): List<StorePriceModel> {
        val rows = listOf("Amazon" to 999.0, "Flipkart" to 949.0, "Meesho" to 899.0, "Croma" to 1049.0)
        val lowest = rows.minOf { it.second }
        return rows.map { (platform, price) ->
            StorePriceModel(
                platform = platform,
                price = price,
                originalPrice = price * 2,
                discountPercent = 50.0,
                deliveryInfo = "See store",
                isLowestPrice = price == lowest
            )
        }
    }
}
