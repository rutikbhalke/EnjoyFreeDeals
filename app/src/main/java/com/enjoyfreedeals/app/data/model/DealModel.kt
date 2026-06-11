package com.enjoyfreedeals.app.data.model

data class DealModel(
    var dealId: String = "",
    var productId: String = dealId,
    var title: String = "",
    var description: String = "",
    var productImage: String = "",
    var imageUrl: String = productImage,
    var sourceImageUrl: String = "",
    var originalPrice: Double = 0.0,
    var discountedPrice: Double = 0.0,
    var dealPrice: Double = discountedPrice,
    var discountPercent: Int = 0,
    var currency: String = "INR",
    var storeName: String = "",
    var storeLogo: String = "",
    var categoryId: String = "",
    var categoryName: String = "",
    var dealType: String = "DISCOUNT",
    var dealUrl: String = "",
    var productUrl: String = dealUrl,
    var platformProductId: String = productId,
    var platformProductUrl: String = productUrl,
    var affiliateUrl: String = "",
    var couponCode: String = "",
    var isHotDeal: Boolean = false,
    var isFreeDeal: Boolean = false,
    var isActive: Boolean = true,
    var isExpired: Boolean = false,
    var isValid: Boolean = true,
    var isFeatured: Boolean = false,
    var isVerified: Boolean = false,
    var shareCount: Int = 0,
    var savedCount: Int = 0,
    var currentPrice: Double = discountedPrice,
    var lowestPrice: Double = currentPrice,
    var bestPlatform: String = storeName,
    var comparisonCount: Int = 0,
    var lastPriceCheckedAt: Long? = null,
    var highestPrice: Double = originalPrice,
    var averagePrice: Double = currentPrice,
    var buyScore: Int? = null,
    var buyScore15Days: Int? = null,
    var buyScore30Days: Int? = null,
    var priceTrend: String? = null,
    var dealScore: Int? = null,
    var isBestPrice: Boolean = false,
    var priceCheckedAt: Long = System.currentTimeMillis(),
    var rating: Double = 4.3,
    var ratingCount: Int = 0,
    var reviewCount: Int = 0,
    var deliveryInfo: String = "Free delivery",
    var availability: String = "in_stock",
    var comparisonPrices: List<StorePriceModel> = emptyList(),
    var createdAt: Long = System.currentTimeMillis(),
    var updatedAt: Long = System.currentTimeMillis(),
    var fetchedAt: Long = updatedAt,
    var lastCheckedAt: Long = fetchedAt,
    var sourceUpdatedAt: Long? = null,
    var platformExpiresAt: Long? = null,
    var expiresAt: Long? = platformExpiresAt,
    var lastScrapedAt: Long = updatedAt,
    var scrapeExpiresAt: Long? = platformExpiresAt,
    var scrapeValidHours: Int? = null,
    var expiryDate: Long? = platformExpiresAt
) {
    val effectivePrice: Double
        get() = if (isFreeDeal) 0.0 else currentPrice.takeIf { it > 0.0 } ?: dealPrice.takeIf { it > 0.0 } ?: discountedPrice

    val redirectUrl: String
        get() = affiliateUrl.ifBlank { productUrl.ifBlank { dealUrl } }

    val displayImageUrl: String
        get() = imageUrl.ifValidHttpUrl()
            ?: sourceImageUrl.ifValidHttpUrl()
            ?: productImage.ifValidHttpUrl()
            ?: ""

    val lowestStorePrice: StorePriceModel?
        get() = comparisonPrices.filter { it.available }.minByOrNull { it.price }

    val canDisplay: Boolean
        get() = isActive && isValid && !isExpired && !isPlatformExpired && hasValidPrice()

    val isPlatformExpired: Boolean
        get() = platformExpiresAt?.let { it <= System.currentTimeMillis() } == true

    fun hasValidPrice(): Boolean =
        effectivePrice >= 0.0 && (originalPrice <= 0.0 || effectivePrice <= originalPrice)
}

private fun String.ifValidHttpUrl(): String? =
    trim().takeIf {
        it.startsWith("https://", ignoreCase = true) || it.startsWith("http://", ignoreCase = true)
    }

data class StorePriceModel(
    var platform: String = "",
    var price: Double = 0.0,
    var originalPrice: Double? = null,
    var discountPercent: Double? = null,
    var productUrl: String = "",
    var affiliateUrl: String = "",
    var available: Boolean = true,
    var deliveryInfo: String = "Free delivery",
    var deliveryCharge: Double? = null,
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
