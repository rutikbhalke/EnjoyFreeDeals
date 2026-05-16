package com.enjoyfreedeals.app.data.model

data class DealModel(
    var dealId: String = "",
    var title: String = "",
    var description: String = "",
    var productImage: String = "",
    var originalPrice: Double = 0.0,
    var discountedPrice: Double = 0.0,
    var discountPercent: Int = 0,
    var storeName: String = "",
    var storeLogo: String = "",
    var categoryId: String = "",
    var categoryName: String = "",
    var dealType: String = "DISCOUNT",
    var dealUrl: String = "",
    var couponCode: String = "",
    var isHotDeal: Boolean = false,
    var isFreeDeal: Boolean = false,
    var isActive: Boolean = true,
    var isFeatured: Boolean = false,
    var shareCount: Int = 0,
    var savedCount: Int = 0,
    var createdAt: Long = System.currentTimeMillis(),
    var expiryDate: Long = System.currentTimeMillis() + DEFAULT_EXPIRY_WINDOW
) {
    val effectivePrice: Double
        get() = if (isFreeDeal) 0.0 else discountedPrice

    companion object {
        const val DEFAULT_EXPIRY_WINDOW: Long = 7L * 24L * 60L * 60L * 1000L
    }
}

