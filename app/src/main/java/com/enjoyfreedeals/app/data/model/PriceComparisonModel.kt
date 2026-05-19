package com.enjoyfreedeals.app.data.model

data class PriceComparisonProductModel(
    val productId: String = "",
    val productName: String = "",
    val imageUrl: String = "",
    val category: String = "",
    val originalPrice: Double = 0.0,
    val lowestPrice: Double = 0.0,
    val discountPercent: Int = 0,
    val ecommercePlatformPrices: List<StorePriceModel> = emptyList(),
    val productUrl: String = "",
    val storeName: String = "",
    val couponCode: String = "",
    val rating: Double = 0.0,
    val isHotDeal: Boolean = false,
    val isFreeDeal: Boolean = false,
    val lastUpdated: Long = System.currentTimeMillis()
)
