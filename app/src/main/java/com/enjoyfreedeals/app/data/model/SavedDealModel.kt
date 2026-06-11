package com.enjoyfreedeals.app.data.model

data class SavedDealModel(
    val id: String = "",
    val userId: String = "",
    val dealId: String = "",
    val productTitle: String = "",
    val platform: String = "",
    val dealPrice: Double = 0.0,
    val originalPrice: Double? = null,
    val discountPercent: Double? = null,
    val productUrl: String = "",
    val imageUrl: String = "",
    val createdAt: String? = null
)
