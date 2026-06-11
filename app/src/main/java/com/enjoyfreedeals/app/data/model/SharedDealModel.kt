package com.enjoyfreedeals.app.data.model

data class SharedDealModel(
    val id: String = "",
    val userId: String = "",
    val dealId: String = "",
    val productTitle: String = "",
    val platform: String = "",
    val dealPrice: Double = 0.0,
    val productUrl: String = "",
    val imageUrl: String = "",
    val sharePlatform: String? = null,
    val sharedTo: String? = null,
    val createdAt: String? = null
)
