package com.enjoyfreedeals.app.data.model

data class BuyScoreModel(
    val productId: String,
    val currentScore: Int,
    val scoreIn15Days: Int,
    val scoreIn30Days: Int,
    val recommendationTitle: String,
    val recommendationSubtitle: String,
    val currentPrice: Double? = null,
    val averagePrice: Double? = null,
    val lowestPrice: Double? = null,
    val highestPrice: Double? = null,
    val priceTrend: String? = null,
    val lastUpdated: String? = null
)
