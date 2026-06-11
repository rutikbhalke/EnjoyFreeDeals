package com.enjoyfreedeals.app.data.model

data class PriceAlertModel(
    val id: String = "",
    val userId: String = "",
    val dealId: String = "",
    val productTitle: String = "",
    val platform: String = "",
    val currentPrice: Double = 0.0,
    val targetPrice: Double = 0.0,
    val originalPrice: Double? = null,
    val productUrl: String = "",
    val imageUrl: String = "",
    val isActive: Boolean = true,
    val isTriggered: Boolean = false,
    val triggeredAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)
