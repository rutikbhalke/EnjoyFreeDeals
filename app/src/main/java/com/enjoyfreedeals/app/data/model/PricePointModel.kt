package com.enjoyfreedeals.app.data.model

import com.google.firebase.firestore.Exclude
import com.google.firebase.firestore.PropertyName

data class PricePointModel(
    @get:PropertyName("id") @set:PropertyName("id")
    var id: String = "",
    @get:PropertyName("product_id") @set:PropertyName("product_id")
    var productId: String = "",
    @get:PropertyName("store_name") @set:PropertyName("store_name")
    var storeName: String = "",
    @get:PropertyName("product_url") @set:PropertyName("product_url")
    var productUrl: String = "",
    @get:PropertyName("affiliate_url") @set:PropertyName("affiliate_url")
    var affiliateUrl: String = "",
    @get:PropertyName("price") @set:PropertyName("price")
    var priceAmount: Double = 0.0,
    @get:PropertyName("current_price") @set:PropertyName("current_price")
    var currentPrice: Double = 0.0,
    @get:PropertyName("original_price") @set:PropertyName("original_price")
    var originalPrice: Double = 0.0,
    @get:PropertyName("lowest_price") @set:PropertyName("lowest_price")
    var lowestPrice: Double = 0.0,
    @get:PropertyName("highest_price") @set:PropertyName("highest_price")
    var highestPrice: Double = 0.0,
    @get:PropertyName("average_price") @set:PropertyName("average_price")
    var averagePrice: Double = 0.0,
    @get:PropertyName("discount_percentage") @set:PropertyName("discount_percentage")
    var discountPercentage: Int = 0,
    @get:PropertyName("price_drop_amount") @set:PropertyName("price_drop_amount")
    var priceDropAmount: Double = 0.0,
    @get:PropertyName("checked_at") @set:PropertyName("checked_at")
    var checkedAt: Long = 0L,
    @get:PropertyName("price_checked_at") @set:PropertyName("price_checked_at")
    var priceCheckedAt: Long = System.currentTimeMillis(),
    @get:PropertyName("created_at") @set:PropertyName("created_at")
    var createdAt: Long = System.currentTimeMillis(),
    @get:PropertyName("updated_at") @set:PropertyName("updated_at")
    var updatedAt: Long = System.currentTimeMillis(),
    var source: String = "mock"
) {
    @get:Exclude
    val historyId: String
        get() = id

    @get:Exclude
    val dealId: String
        get() = productId

    @get:Exclude
    val price: Double
        get() = priceAmount.takeIf { it > 0.0 } ?: currentPrice

    @get:Exclude
    val recordedAt: Long
        get() = checkedAt.takeIf { it > 0L } ?: priceCheckedAt
}

data class PriceStatsModel(
    val currentPrice: Double = 0.0,
    val averagePrice: Double = 0.0,
    val highestPrice: Double = 0.0,
    val lowestPrice: Double = 0.0,
    val dropFromAveragePercent: Int = 0,
    val isLowestPriceNow: Boolean = false
)
