package com.enjoyfreedeals.app.data.model.supabase

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ActiveDealDto(
    @SerialName("offer_id") val offerId: String = "",
    @SerialName("product_id") val productId: String = "",
    @SerialName("product_name") val productName: String = "",
    val brand: String? = null,
    val model: String? = null,
    @SerialName("category_name") val categoryName: String = "",
    @SerialName("category_slug") val categorySlug: String = "",
    @SerialName("store_name") val storeName: String = "",
    @SerialName("store_slug") val storeSlug: String = "",
    @SerialName("store_logo_url") val storeLogoUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("source_image_url") val sourceImageUrl: String? = null,
    @SerialName("imageUrl") val camelImageUrl: String? = null,
    @SerialName("product_image") val productImageUrl: String? = null,
    @SerialName("productImage") val camelProductImageUrl: String? = null,
    @SerialName("photo_url") val photoUrl: String? = null,
    @SerialName("thumbnail_url") val thumbnailUrl: String? = null,
    val thumbnail: String? = null,
    val title: String = "",
    @SerialName("product_url") val productUrl: String = "",
    @SerialName("platform_product_url") val platformProductUrl: String? = null,
    @SerialName("affiliate_url") val affiliateUrl: String? = null,
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("lowest_price") val lowestPrice: Double? = null,
    val currency: String = "INR",
    @SerialName("discount_percent") val discountPercent: Int? = null,
    @SerialName("coupon_code") val couponCode: String? = null,
    @SerialName("delivery_info") val deliveryInfo: String? = null,
    val rating: Double? = null,
    @SerialName("rating_count") val ratingCount: Int? = null,
    @SerialName("review_count") val reviewCount: Int? = null,
    @SerialName("is_hot_deal") val isHotDeal: Boolean = false,
    @SerialName("is_free_deal") val isFreeDeal: Boolean = false,
    @SerialName("is_lowest_price") val isLowestPrice: Boolean = false,
    val availability: String? = null,
    @SerialName("last_updated") val lastUpdated: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null
)

@Serializable
data class PriceComparisonDto(
    @SerialName("product_id") val productId: String = "",
    @SerialName("product_name") val productName: String = "",
    @SerialName("offer_id") val offerId: String = "",
    @SerialName("store_name") val storeName: String = "",
    @SerialName("store_slug") val storeSlug: String = "",
    @SerialName("store_logo_url") val storeLogoUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("imageUrl") val camelImageUrl: String? = null,
    @SerialName("product_image") val productImageUrl: String? = null,
    @SerialName("photo_url") val photoUrl: String? = null,
    @SerialName("thumbnail_url") val thumbnailUrl: String? = null,
    @SerialName("current_price") val currentPrice: Double? = null,
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("discount_percent") val discountPercent: Int? = null,
    val currency: String = "INR",
    val availability: String? = null,
    val rating: Double? = null,
    @SerialName("rating_count") val ratingCount: Int? = null,
    @SerialName("review_count") val reviewCount: Int? = null,
    @SerialName("product_url") val productUrl: String = "",
    @SerialName("affiliate_url") val affiliateUrl: String? = null,
    @SerialName("is_lowest_price") val isLowestPrice: Boolean = false,
    @SerialName("last_checked_at") val lastCheckedAt: String? = null
)

@Serializable
data class ProductPriceStatsDto(
    @SerialName("product_id") val productId: String = "",
    @SerialName("min_price") val minPrice: Double? = null,
    @SerialName("max_price") val maxPrice: Double? = null,
    @SerialName("avg_price") val avgPrice: Double? = null,
    val points: Int? = null,
    @SerialName("last_captured_at") val lastCapturedAt: String? = null
)

@Serializable
data class SavedDealDto(
    val id: String = "",
    @SerialName("user_id") val userId: String = "",
    @SerialName("deal_id") val dealId: String = "",
    @SerialName("product_title") val productTitle: String? = null,
    val platform: String? = null,
    @SerialName("deal_price") val dealPrice: Double? = null,
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("discount_percent") val discountPercent: Double? = null,
    @SerialName("product_url") val productUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class SharedDealDto(
    val id: String = "",
    @SerialName("user_id") val userId: String = "",
    @SerialName("deal_id") val dealId: String = "",
    @SerialName("product_title") val productTitle: String? = null,
    val platform: String? = null,
    @SerialName("deal_price") val dealPrice: Double? = null,
    @SerialName("product_url") val productUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("share_platform") val sharePlatform: String? = null,
    @SerialName("shared_to") val sharedTo: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class PriceAlertDto(
    val id: String = "",
    @SerialName("user_id") val userId: String = "",
    @SerialName("deal_id") val dealId: String = "",
    @SerialName("product_title") val productTitle: String? = null,
    val platform: String? = null,
    @SerialName("target_price") val targetPrice: Double = 0.0,
    @SerialName("current_price") val currentPrice: Double? = null,
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("product_url") val productUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("is_triggered") val isTriggered: Boolean = false,
    @SerialName("triggered_at") val triggeredAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null
)

@Serializable
data class RecentlyViewedDealDto(
    val id: String = "",
    @SerialName("user_id") val userId: String = "",
    @SerialName("deal_id") val dealId: String = "",
    @SerialName("product_title") val productTitle: String? = null,
    val platform: String? = null,
    @SerialName("deal_price") val dealPrice: Double? = null,
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("discount_percent") val discountPercent: Double? = null,
    @SerialName("product_url") val productUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("viewed_at") val viewedAt: String? = null
)

@Serializable
data class PriceHistoryDto(
    val id: String = "",
    @SerialName("product_id") val productId: String = "",
    @SerialName("store_name") val storeName: String = "",
    val price: Double? = null,
    @SerialName("current_price") val currentPrice: Double? = null,
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("discount_percentage") val discountPercentage: Int? = null,
    @SerialName("discount_percent") val discountPercent: Int? = null,
    @SerialName("price_drop_amount") val priceDropAmount: Double? = null,
    @SerialName("product_url") val productUrl: String? = null,
    @SerialName("affiliate_url") val affiliateUrl: String? = null,
    @SerialName("checked_at") val checkedAt: String? = null,
    @SerialName("price_checked_at") val priceCheckedAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class NewSavedDealDto(
    @SerialName("user_id") val userId: String,
    @SerialName("deal_id") val dealId: String,
    @SerialName("product_title") val productTitle: String? = null,
    val platform: String? = null,
    @SerialName("deal_price") val dealPrice: Double? = null,
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("discount_percent") val discountPercent: Double? = null,
    @SerialName("product_url") val productUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null
)

@Serializable
data class NewPriceAlertDto(
    @SerialName("user_id") val userId: String,
    @SerialName("deal_id") val dealId: String,
    @SerialName("product_title") val productTitle: String? = null,
    val platform: String? = null,
    @SerialName("current_price") val currentPrice: Double? = null,
    @SerialName("target_price") val targetPrice: Double,
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("product_url") val productUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("is_active") val isActive: Boolean = true
)

@Serializable
data class UpdatePriceAlertDto(
    @SerialName("is_active") val isActive: Boolean? = null,
    @SerialName("target_price") val targetPrice: Double? = null,
    @SerialName("updated_at") val updatedAt: String? = null
)

@Serializable
data class NewSharedDealDto(
    @SerialName("user_id") val userId: String,
    @SerialName("deal_id") val dealId: String,
    @SerialName("product_title") val productTitle: String? = null,
    val platform: String? = null,
    @SerialName("deal_price") val dealPrice: Double? = null,
    @SerialName("product_url") val productUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("share_platform") val sharePlatform: String? = null,
    @SerialName("shared_to") val sharedTo: String? = null
)

@Serializable
data class NewRecentlyViewedDealDto(
    @SerialName("user_id") val userId: String,
    @SerialName("deal_id") val dealId: String,
    @SerialName("product_title") val productTitle: String? = null,
    val platform: String? = null,
    @SerialName("deal_price") val dealPrice: Double? = null,
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("discount_percent") val discountPercent: Double? = null,
    @SerialName("product_url") val productUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null
)
