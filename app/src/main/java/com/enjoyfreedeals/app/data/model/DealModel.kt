package com.enjoyfreedeals.app.data.model

data class DealModel(
    var dealId: String = "",
    var productId: String = dealId,
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
    var productUrl: String = dealUrl,
    var affiliateUrl: String = "",
    var couponCode: String = "",
    var isHotDeal: Boolean = false,
    var isFreeDeal: Boolean = false,
    var isActive: Boolean = true,
    var isFeatured: Boolean = false,
    var isVerified: Boolean = false,
    var shareCount: Int = 0,
    var savedCount: Int = 0,
    var currentPrice: Double = discountedPrice,
    var lowestPrice: Double = currentPrice,
    var highestPrice: Double = originalPrice,
    var averagePrice: Double = currentPrice,
    var priceCheckedAt: Long = System.currentTimeMillis(),
    var rating: Double = 4.3,
    var ratingCount: Int = 0,
    var reviewCount: Int = 0,
    var deliveryInfo: String = "Free delivery",
    var availability: String = "in_stock",
    var comparisonPrices: List<StorePriceModel> = emptyList(),
    var createdAt: Long = System.currentTimeMillis(),
    var updatedAt: Long = System.currentTimeMillis(),
    var lastScrapedAt: Long = updatedAt,
    var scrapeExpiresAt: Long = lastScrapedAt + SCRAPE_VALID_WINDOW,
    var scrapeValidHours: Int = 24,
    var expiryDate: Long = System.currentTimeMillis() + DEFAULT_EXPIRY_WINDOW
) {
    val effectivePrice: Double
        get() = if (isFreeDeal) 0.0 else currentPrice.takeIf { it > 0.0 } ?: discountedPrice

    val redirectUrl: String
        get() = affiliateUrl.ifBlank { productUrl.ifBlank { dealUrl } }

    val lowestStorePrice: StorePriceModel?
        get() = comparisonPrices.filter { it.available }.minByOrNull { it.price }

    companion object {
        const val DEFAULT_EXPIRY_WINDOW: Long = 7L * 24L * 60L * 60L * 1000L
        const val SCRAPE_VALID_WINDOW: Long = 24L * 60L * 60L * 1000L
    }
}

data class StorePriceModel(
    var platform: String = "",
    var price: Double = 0.0,
    var productUrl: String = "",
    var affiliateUrl: String = "",
    var available: Boolean = true,
    var deliveryInfo: String = "Free delivery",
    var rating: Double = 4.2,
    var ratingCount: Int = 0,
    var reviewCount: Int = 0,
    var couponCode: String = "",
    var isLowestPrice: Boolean = false,
    var storeLogoUrl: String = "",
    var lastUpdated: Long = System.currentTimeMillis()
) {
    val redirectUrl: String
        get() = affiliateUrl.ifBlank { productUrl }
}
