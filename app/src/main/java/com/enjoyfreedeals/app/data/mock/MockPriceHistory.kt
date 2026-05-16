package com.enjoyfreedeals.app.data.mock

import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PricePointModel

object MockPriceHistory {
    private const val DAY_MS = 24L * 60L * 60L * 1000L

    val priceHistory: Map<String, List<PricePointModel>> =
        MockDeals.deals.associate { deal -> deal.dealId to historyFor(deal) }

    fun historyFor(deal: DealModel): List<PricePointModel> {
        val now = System.currentTimeMillis()
        val current = deal.effectivePrice
        if (current <= 0.0) {
            return (29 downTo 0).map { index ->
                PricePointModel(
                    id = "${deal.dealId}-$index",
                    productId = deal.dealId,
                    storeName = deal.storeName,
                    productUrl = deal.productUrl,
                    affiliateUrl = deal.redirectUrl,
                    priceAmount = 0.0,
                    currentPrice = 0.0,
                    originalPrice = deal.originalPrice,
                    lowestPrice = 0.0,
                    highestPrice = deal.originalPrice,
                    averagePrice = 0.0,
                    discountPercentage = deal.discountPercent,
                    priceDropAmount = 0.0,
                    checkedAt = now - index * DAY_MS,
                    priceCheckedAt = now - index * DAY_MS,
                    createdAt = now - index * DAY_MS,
                    updatedAt = now - index * DAY_MS
                )
            }
        }

        val original = deal.originalPrice.coerceAtLeast(current)
        val rawPoints = (29 downTo 0).map { index ->
            val progress = (29 - index) / 29.0
            val drift = original - ((original - current) * progress)
            val wave = when (index % 6) {
                0 -> original * 0.04
                1 -> original * -0.015
                2 -> original * 0.025
                3 -> original * -0.02
                else -> 0.0
            }
            val price = if (index == 0) current else (drift + wave).coerceAtLeast(current * 0.92)
            now - index * DAY_MS to price
        }.sortedBy { it.first }
        val prices = rawPoints.map { it.second }
        val lowest = prices.minOrNull() ?: current
        val highest = prices.maxOrNull() ?: current
        val average = prices.average()

        return rawPoints.mapIndexed { position, (checkedAt, price) ->
            val previousPrice = rawPoints.getOrNull(position - 1)?.second ?: price
            PricePointModel(
                id = "${deal.dealId}-$position",
                productId = deal.dealId,
                storeName = deal.storeName,
                productUrl = deal.productUrl,
                affiliateUrl = deal.redirectUrl,
                priceAmount = price,
                currentPrice = price,
                originalPrice = deal.originalPrice,
                lowestPrice = lowest,
                highestPrice = highest,
                averagePrice = average,
                discountPercentage = deal.discountPercent,
                priceDropAmount = (previousPrice - price).coerceAtLeast(0.0),
                checkedAt = checkedAt,
                priceCheckedAt = checkedAt,
                createdAt = checkedAt,
                updatedAt = checkedAt
            )
        }
    }
}
