package com.enjoyfreedeals.app.utils

import kotlin.math.abs
import kotlin.math.roundToInt

object BuyScoreCalculator {
    fun calculateBuyScore(
        currentPrice: Double,
        averagePrice: Double?,
        lowestPrice: Double?,
        highestPrice: Double?,
        discountPercent: Double?,
        dealScore: Int?,
        isHotDeal: Boolean,
        isBestPrice: Boolean
    ): Int {
        var score = 50
        val average = averagePrice?.takeIf { it > 0.0 }
        val lowest = lowestPrice?.takeIf { it > 0.0 }
        val discount = discountPercent ?: 0.0
        val dealScoreValue = dealScore ?: 0

        if (average != null && currentPrice > 0.0) {
            val belowAveragePercent = ((average - currentPrice) / average) * 100
            when {
                belowAveragePercent >= 20 -> score += 20
                belowAveragePercent >= 10 -> score += 10
                currentPrice > average -> score -= 15
            }
        }

        if (lowest != null && currentPrice > 0.0) {
            val nearLowest = abs(currentPrice - lowest) <= lowest * 0.05
            if (nearLowest) score += 15
        }

        when {
            discount >= 75 -> score += 15
            discount >= 60 -> score += 10
            discount >= 0.0 && discount < 20.0 -> score -= 10
        }

        if (dealScoreValue >= 85) score += 10
        if (dealScoreValue in 1 until 50) score -= 10
        if (isHotDeal) score += 5
        if (isBestPrice) score += 10

        if (highestPrice != null && highestPrice > 0.0 && currentPrice > 0.0 && currentPrice <= highestPrice * 0.70) {
            score += 5
        }

        return score.coerceIn(0, 100)
    }

    fun predictedScore(currentScore: Int, priceTrend: String?, days: Int): Int {
        val delta = when (priceTrend?.lowercase()) {
            "rising", "up", "upward" -> if (days >= 30) -10 else -5
            "falling", "down", "downward" -> if (days >= 30) 10 else 5
            else -> 0
        }
        return (currentScore + delta).coerceIn(0, 100)
    }

    fun inferPriceTrend(currentPrice: Double, averagePrice: Double?, lowestPrice: Double?): String {
        val average = averagePrice?.takeIf { it > 0.0 } ?: return "stable"
        val lowest = lowestPrice?.takeIf { it > 0.0 }
        return when {
            currentPrice <= average * 0.90 -> "rising"
            lowest != null && currentPrice <= lowest * 1.05 -> "rising"
            currentPrice > average * 1.05 -> "falling"
            else -> "stable"
        }
    }

    fun recommendationTitle(score: Int): String = when {
        score >= 70 -> "Great time to buy."
        score >= 50 -> "Good time to buy."
        else -> "Wait for a better deal."
    }

    fun recommendationSubtitle(score: Int): String = when {
        score >= 70 -> "This deal looks strong. Current price is better than usual."
        score >= 50 -> "This deal is solid. Prices have been higher more often than lower."
        else -> "This price may drop again. Track this deal before buying."
    }

    fun scoreLabel(score: Double): String = score.roundToInt().coerceIn(0, 100).toString()
}
