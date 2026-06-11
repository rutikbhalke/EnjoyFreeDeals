package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.BuyScoreModel
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import com.enjoyfreedeals.app.data.remote.dataObject
import com.enjoyfreedeals.app.utils.BuyScoreCalculator

class BuyScoreRepository(private val context: Context) {
    private val backendClient = BackendClient()

    suspend fun getBuyScore(productId: String, deal: DealModel): BuyScoreModel =
        runCatching {
            backendClient
                .get("/api/buy-score?productId=${productId.urlEncode()}", AuthSessionStore.accessToken(context))
                .dataObject()
                .takeIf { it.length() > 0 }
                ?.let { json ->
                    BuyScoreModel(
                        productId = json.optString("product_id", productId),
                        currentScore = json.optInt("current_score", 0).coerceIn(0, 100),
                        scoreIn15Days = json.optInt("score_in_15_days", 0).coerceIn(0, 100),
                        scoreIn30Days = json.optInt("score_in_30_days", 0).coerceIn(0, 100),
                        recommendationTitle = json.optString("recommendation_title"),
                        recommendationSubtitle = json.optString("recommendation_subtitle"),
                        currentPrice = json.optNullableDouble("current_price"),
                        averagePrice = json.optNullableDouble("average_price"),
                        lowestPrice = json.optNullableDouble("lowest_price"),
                        highestPrice = json.optNullableDouble("highest_price"),
                        priceTrend = json.optString("price_trend").ifBlank { null },
                        lastUpdated = json.optString("last_updated").ifBlank { null }
                    )
                }
                ?.takeIf { it.currentScore > 0 && it.recommendationTitle.isNotBlank() }
                ?: calculateLocalBuyScore(deal)
        }.getOrElse {
            calculateLocalBuyScore(deal)
        }

    fun calculateLocalBuyScore(deal: DealModel): BuyScoreModel {
        val currentPrice = deal.effectivePrice
        val averagePrice = deal.averagePrice.takeIf { it > 0.0 }
        val lowestPrice = deal.lowestPrice.takeIf { it > 0.0 }
        val highestPrice = deal.highestPrice.takeIf { it > 0.0 }
        val trend = deal.priceTrend ?: BuyScoreCalculator.inferPriceTrend(currentPrice, averagePrice, lowestPrice)
        val currentScore = deal.buyScore ?: BuyScoreCalculator.calculateBuyScore(
            currentPrice = currentPrice,
            averagePrice = averagePrice,
            lowestPrice = lowestPrice,
            highestPrice = highestPrice,
            discountPercent = deal.discountPercent.toDouble(),
            dealScore = deal.dealScore,
            isHotDeal = deal.isHotDeal,
            isBestPrice = deal.isBestPrice || deal.lowestStorePrice?.price == currentPrice
        )
        val score15 = deal.buyScore15Days ?: BuyScoreCalculator.predictedScore(currentScore, trend, 15)
        val score30 = deal.buyScore30Days ?: BuyScoreCalculator.predictedScore(currentScore, trend, 30)

        return BuyScoreModel(
            productId = deal.productId.ifBlank { deal.dealId },
            currentScore = currentScore.coerceIn(0, 100),
            scoreIn15Days = score15.coerceIn(0, 100),
            scoreIn30Days = score30.coerceIn(0, 100),
            recommendationTitle = BuyScoreCalculator.recommendationTitle(currentScore),
            recommendationSubtitle = BuyScoreCalculator.recommendationSubtitle(currentScore),
            currentPrice = currentPrice,
            averagePrice = averagePrice,
            lowestPrice = lowestPrice,
            highestPrice = highestPrice,
            priceTrend = trend,
            lastUpdated = null
        )
    }
}

private fun String.urlEncode(): String =
    java.net.URLEncoder.encode(this, Charsets.UTF_8.name())

private fun org.json.JSONObject.optNullableDouble(name: String): Double? =
    if (has(name) && !isNull(name)) optDouble(name).takeIf { it > 0.0 } else null
