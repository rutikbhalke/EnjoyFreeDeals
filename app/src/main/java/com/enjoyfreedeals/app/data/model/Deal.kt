@file:Suppress("unused")

package com.enjoyfreedeals.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

@Serializable
data class Deal(
    val id: String = "",
    val title: String = "",
    val slug: String = "",
    val description: String = "",
    val store: String = "",
    @SerialName("store_id") val storeId: String = "",
    @SerialName("category_id") val categoryId: String = "",
    @SerialName("original_price") val originalPrice: Double = 0.0,
    @SerialName("discounted_price") val discountedPrice: Double = 0.0,
    @SerialName("discount_percent") val discountPercent: Int = 0,
    @SerialName("discount_percentage") val discountPercentage: Int? = null,
    @SerialName("coupon_code") val couponCode: String? = null,
    @SerialName("cashback_percentage") val cashbackPercentage: Int? = null,
    @SerialName("image_url") val imageUrl: String = "",
    @SerialName("affiliate_url") val affiliateUrl: String = "",
    @SerialName("affiliate_link") val affiliateLink: String = "",
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("expiry_date") val expiryDate: String? = null,
    val status: String = "active",
    @SerialName("is_featured") val isFeatured: Boolean? = null,
    @SerialName("is_verified") val isVerified: Boolean? = null,
    @SerialName("click_count") val clickCount: Int? = null,
    @SerialName("submitted_by") val submittedBy: String? = null,
    val source: String? = null,
    @SerialName("vote_score") val voteScore: Int? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null
) {
    val displayStore: String
        get() = store.ifBlank { storeId }

    val effectiveDiscountPercent: Int
        get() = discountPercent.takeIf { it > 0 } ?: discountPercentage ?: 0

    val effectiveAffiliateUrl: String
        get() = affiliateUrl.ifBlank { affiliateLink }

    val isVisibleDeal: Boolean
        get() = isActive && status.equals("active", ignoreCase = true)

    val createdAtMillis: Long
        get() = createdAt.toMillisOrNow()

    val updatedAtMillis: Long
        get() = updatedAt.toMillisOrDefault(createdAtMillis)
}

private fun String?.toMillisOrNow(): Long = toMillisOrDefault(System.currentTimeMillis())

private fun String?.toMillisOrDefault(defaultValue: Long): Long {
    if (isNullOrBlank()) return defaultValue
    val normalized = replace(Regex("\\.\\d+(Z|[+-])"), "$1")
    val patterns = listOf(
        "yyyy-MM-dd'T'HH:mm:ss'Z'",
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd"
    )
    return patterns.firstNotNullOfOrNull { pattern ->
        runCatching {
            SimpleDateFormat(pattern, Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.parse(normalized)?.time
        }.getOrNull()
    } ?: defaultValue
}
