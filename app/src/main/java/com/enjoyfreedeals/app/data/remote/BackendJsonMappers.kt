package com.enjoyfreedeals.app.data.remote

import com.enjoyfreedeals.app.data.model.BlogModel
import com.enjoyfreedeals.app.data.model.CategoryModel
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.NotificationModel
import com.enjoyfreedeals.app.data.model.PriceComparisonProductModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.data.model.UserModel
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Locale

fun JSONArray.toJsonObjects(): List<JSONObject> =
    (0 until length()).mapNotNull { index -> optJSONObject(index) }

fun JSONObject.dataArray(): JSONArray =
    optJSONArray("data") ?: JSONArray()

fun JSONObject.dataObject(): JSONObject =
    optJSONObject("data") ?: JSONObject()

fun JSONObject.toDealModel(): DealModel {
    val current = optDoubleValue("dealPrice", "currentPrice", "discountedPrice", "deal_price", "current_price", "discounted_price")
    val original = optDoubleValue("originalPrice", "original_price", default = current)
    val title = optStringValue("title")
    val storeName = optStringValue("storeName", "store_name")
    val categoryName = optStringValue("categoryName", "category_name", "categorySlug", default = "Other Deals")
    val productImage = optStringValue(
        "productImage",
        "imageUrl",
        "image",
        "image_url",
        "product_image",
        "photo",
        "photo_url",
        "thumbnail",
        "thumbnail_url",
        "picture_url"
    )
    val sourceImage = optStringValue("sourceImageUrl", "source_image_url", "platformImageUrl", "platform_image_url")
    val resolvedImage = productImage.ifBlank { sourceImage }.takeIf { it.isValidHttpUrl() }.orEmpty()
    val comparisonPrices = optJSONArray("comparisonPrices")
        ?.toJsonObjects()
        ?.map { it.toStorePriceModel() }
        .orEmpty()
    val fetchedAt = optTimestampValue("fetchedAt", "fetched_at", "lastScrapedAt", "last_scraped_at", "scrapedAt", "scraped_at", default = optTimestampValue("updatedAt", "updated_at"))
    val platformExpiresAt = optNullableTimestampValue("platformExpiresAt", "platform_expires_at", "expiresAt", "expires_at", "expiryDate", "expiry_date")
    val safeDiscount = optIntValue("discountPercent", "discount_percentage").takeIf { it in 0..100 }
        ?: calculateDiscountPercent(original, current)
    val isExpired = optBooleanValue("isExpired", "is_expired", default = platformExpiresAt?.let { it <= System.currentTimeMillis() } == true)
    val isValid = optBooleanValue("isValid", "is_valid", default = hasValidPrice(original, current))

    return DealModel(
        dealId = optStringValue("dealId", "id", "deal_id"),
        productId = optStringValue("productId", "product_id", "dealId", "id", "deal_id"),
        title = title,
        description = optStringValue("description"),
        productImage = resolvedImage,
        imageUrl = resolvedImage,
        sourceImageUrl = sourceImage.takeIf { it.isValidHttpUrl() }.orEmpty(),
        originalPrice = original,
        dealPrice = optDoubleValue("dealPrice", "deal_price", default = current),
        discountedPrice = optDoubleValue("discountedPrice", "discounted_price", default = current),
        discountPercent = safeDiscount,
        currency = optStringValue("currency", default = "INR"),
        storeName = storeName,
        storeLogo = optStringValue("storeLogo", "store_logo"),
        categoryId = optStringValue("categoryId", "category_id", "categorySlug", "category_slug"),
        categoryName = categoryName,
        dealType = optStringValue("dealType", "source", default = "manual"),
        dealUrl = optStringValue("dealUrl", "deal_url"),
        productUrl = optStringValue("productUrl", "product_url", "dealUrl"),
        platformProductId = optStringValue("platformProductId", "platform_product_id", "sourceProductId", "source_product_id", "asin", "sku", "productId", "product_id"),
        platformProductUrl = optStringValue("platformProductUrl", "platform_product_url", "productUrl", "product_url", "dealUrl"),
        affiliateUrl = optStringValue("affiliateUrl", "affiliate_url", "dealUrl"),
        couponCode = optStringValue("couponCode", "coupon_code"),
        isHotDeal = optBooleanValue("isHotDeal", "is_hot_deal"),
        isFreeDeal = optBooleanValue("isFreeDeal", "is_free_deal"),
        isActive = optBooleanValue("isActive", "is_active", default = true),
        isExpired = isExpired,
        isValid = isValid,
        isFeatured = optBooleanValue("isFeatured", "is_featured"),
        isVerified = optBooleanValue("isVerified", "is_verified"),
        shareCount = optIntValue("shareCount", "share_count"),
        savedCount = optIntValue("savedCount", "saved_count"),
        currentPrice = current,
        lowestPrice = optDoubleValue("lowestPrice", "lowest_price", default = current),
        highestPrice = optDoubleValue("highestPrice", "highest_price", default = original),
        averagePrice = optDoubleValue("averagePrice", "average_price", default = current),
        rating = optDoubleValue("rating", default = 4.3),
        ratingCount = optIntValue("ratingCount", "rating_count"),
        reviewCount = optIntValue("reviewCount", "review_count"),
        deliveryInfo = optStringValue("deliveryInfo", "delivery_info", default = "See store"),
        availability = optStringValue("availability", default = "in_stock"),
        comparisonPrices = comparisonPrices,
        createdAt = optTimestampValue("createdAt", "created_at"),
        updatedAt = optTimestampValue("updatedAt", "updated_at"),
        fetchedAt = fetchedAt,
        lastCheckedAt = optTimestampValue("lastCheckedAt", "last_checked_at", default = fetchedAt),
        sourceUpdatedAt = optNullableTimestampValue("sourceUpdatedAt", "source_updated_at"),
        platformExpiresAt = platformExpiresAt,
        expiresAt = platformExpiresAt,
        lastScrapedAt = fetchedAt,
        scrapeExpiresAt = platformExpiresAt,
        scrapeValidHours = optIntValue("scrapeValidHours", "scrape_valid_hours", default = 0).takeIf { it > 0 },
        expiryDate = platformExpiresAt
    )
}

fun JSONObject.toCategoryModel(): CategoryModel =
    CategoryModel(
        categoryId = optStringValue("categoryId", "id"),
        categoryName = optStringValue("categoryName", "name"),
        categoryIcon = optStringValue("categoryIcon", "icon", "slug"),
        categoryImage = optStringValue("categoryImage", "image_url"),
        description = optStringValue("description"),
        isActive = optBooleanValue("isActive", "is_active", default = true),
        createdAt = optTimestampValue("createdAt", "created_at")
    )

fun JSONObject.toBlogModel(): BlogModel =
    BlogModel(
        blogId = optStringValue("blogId", "id"),
        title = optStringValue("title"),
        image = optStringValue("image", "cover_image"),
        shortDescription = optStringValue("shortDescription", "excerpt"),
        fullContent = optStringValue("fullContent", "content"),
        author = optStringValue("author", "author_name", default = "BizFlow Team"),
        isPublished = optBooleanValue("isPublished", "is_published", default = true),
        createdAt = optTimestampValue("createdAt", "created_at", "publishedAt", "published_at"),
        updatedAt = optTimestampValue("updatedAt", "updated_at")
    )

fun JSONObject.toNotificationModel(): NotificationModel =
    NotificationModel(
        notificationId = optStringValue("notificationId", "id"),
        title = optStringValue("title"),
        message = optStringValue("message"),
        image = optStringValue("image", "imageUrl", "image_url"),
        dealId = optStringValue("dealId", "deal_id"),
        targetUrl = optStringValue("targetUrl", "target_url"),
        notificationType = optStringValue("notificationType", "type", default = "SYSTEM"),
        isRead = optBooleanValue("isRead", "is_read"),
        userId = optStringValue("userId", "user_id"),
        createdAt = optTimestampValue("createdAt", "created_at")
    )

fun JSONObject.toUserModel(existing: UserModel = UserModel()): UserModel =
    existing.copy(
        userId = optStringValue("userId", "id", "user_id", default = existing.userId),
        name = optStringValue("name", "fullName", "full_name", default = existing.name),
        email = optStringValue("email", default = existing.email),
        mobile = optStringValue("mobile", "phone", default = existing.mobile),
        profileImage = optStringValue("profileImage", "avatarUrl", "avatar_url", default = existing.profileImage),
        createdAt = optTimestampValue("createdAt", "created_at", default = existing.createdAt),
        updatedAt = optTimestampValue("updatedAt", "updated_at", default = existing.updatedAt)
    )

fun JSONObject.toPricePointModel(fallbackDealId: String = ""): PricePointModel =
    PricePointModel(
        id = optStringValue("id"),
        productId = optStringValue("productId", "dealId", "deal_id", default = fallbackDealId),
        storeName = optStringValue("storeName", "store_name"),
        productUrl = optStringValue("productUrl", "product_url"),
        affiliateUrl = optStringValue("affiliateUrl", "affiliate_url"),
        priceAmount = optDoubleValue("price", "priceAmount", default = optDoubleValue("currentPrice", "current_price")),
        currentPrice = optDoubleValue("currentPrice", "current_price", "price"),
        originalPrice = optDoubleValue("originalPrice", "original_price"),
        lowestPrice = optDoubleValue("lowestPrice", "lowest_price"),
        highestPrice = optDoubleValue("highestPrice", "highest_price"),
        averagePrice = optDoubleValue("averagePrice", "average_price"),
        discountPercentage = optIntValue("discountPercentage", "discount_percentage"),
        priceDropAmount = optDoubleValue("priceDropAmount", "price_drop_amount"),
        checkedAt = optTimestampValue("checkedAt", "recordedAt", "recorded_at"),
        priceCheckedAt = optTimestampValue("priceCheckedAt", "recordedAt", "recorded_at"),
        createdAt = optTimestampValue("createdAt", "created_at"),
        updatedAt = optTimestampValue("updatedAt", "updated_at"),
        source = optStringValue("source", default = "backend")
    )

fun JSONObject.toPriceComparisonProductModel(): PriceComparisonProductModel {
    val productName = optStringValue("productName", "product_name", "title")
    val category = optStringValue("category", "categoryName")
    val storeName = optStringValue("storeName", "store_name")
    val imageUrl = optStringValue(
        "imageUrl",
        "image_url",
        "productImage",
        "product_image",
        "photo",
        "photo_url",
        "thumbnail",
        "thumbnail_url",
        "picture_url"
    )
    return PriceComparisonProductModel(
        productId = optStringValue("productId", "dealId", "deal_id", "id"),
        productName = productName,
        imageUrl = imageUrl.takeIf { it.isValidHttpUrl() }.orEmpty(),
        category = category,
        originalPrice = optDoubleValue("originalPrice", "original_price"),
        lowestPrice = optDoubleValue("lowestPrice", "lowest_price", "currentPrice"),
        discountPercent = optIntValue("discountPercent", "discount_percentage"),
        ecommercePlatformPrices = optJSONArray("ecommercePlatformPrices")
            ?.toJsonObjects()
            ?.map { it.toStorePriceModel() }
            .orEmpty(),
        productUrl = optStringValue("productUrl", "product_url"),
        storeName = storeName,
        couponCode = optStringValue("couponCode", "coupon_code"),
        rating = optDoubleValue("rating"),
        isHotDeal = optBooleanValue("isHotDeal", "is_hot_deal"),
        isFreeDeal = optBooleanValue("isFreeDeal", "is_free_deal"),
        lastUpdated = optTimestampValue("lastUpdated", "last_updated")
    )
}

fun JSONObject.toStorePriceModel(): StorePriceModel =
    StorePriceModel(
        platform = optStringValue("platform"),
        price = optDoubleValue("price"),
        productUrl = optStringValue("productUrl", "product_url"),
        affiliateUrl = optStringValue("affiliateUrl", "affiliate_url"),
        available = optBooleanValue("available", default = true),
        deliveryInfo = optStringValue("deliveryInfo", "delivery_info", default = "Free delivery"),
        rating = optDoubleValue("rating", default = 4.2),
        ratingCount = optIntValue("ratingCount", "rating_count"),
        reviewCount = optIntValue("reviewCount", "review_count"),
        couponCode = optStringValue("couponCode", "coupon_code"),
        isLowestPrice = optBooleanValue("isLowestPrice", "is_lowest_price"),
        storeLogoUrl = optStringValue("storeLogoUrl", "store_logo_url"),
        lastUpdated = optTimestampValue("lastUpdated", "last_updated")
    )

fun JSONObject.optStringValue(vararg keys: String, default: String = ""): String {
    keys.forEach { key ->
        if (has(key) && !isNull(key)) {
            val value = optString(key).trim()
            if (value.isNotBlank() && value != "null") return value
        }
    }
    return default
}

fun JSONObject.optDoubleValue(vararg keys: String, default: Double = 0.0): Double {
    keys.forEach { key ->
        val value = opt(key)
        when (value) {
            is Number -> return value.toDouble()
            is String -> value.toDoubleOrNull()?.let { return it }
        }
    }
    return default
}

fun JSONObject.optIntValue(vararg keys: String, default: Int = 0): Int =
    optDoubleValue(*keys, default = default.toDouble()).toInt()

fun JSONObject.optBooleanValue(vararg keys: String, default: Boolean = false): Boolean {
    keys.forEach { key ->
        val value = opt(key)
        when (value) {
            is Boolean -> return value
            is Number -> return value.toInt() != 0
            is String -> {
                if (value.equals("true", ignoreCase = true)) return true
                if (value.equals("false", ignoreCase = true)) return false
            }
        }
    }
    return default
}

fun JSONObject.optTimestampValue(vararg keys: String, default: Long = System.currentTimeMillis()): Long {
    keys.forEach { key ->
        val value = opt(key)
        when (value) {
            is Number -> return value.toLong()
            is String -> parseBackendTimestamp(value)?.let { return it }
        }
    }
    return default
}

fun JSONObject.optNullableTimestampValue(vararg keys: String): Long? {
    keys.forEach { key ->
        val value = opt(key)
        when (value) {
            is Number -> return value.toLong()
            is String -> parseBackendTimestamp(value)?.let { return it }
        }
    }
    return null
}

private fun calculateDiscountPercent(originalPrice: Double, dealPrice: Double): Int =
    if (originalPrice > 0.0 && dealPrice >= 0.0 && dealPrice <= originalPrice) {
        (((originalPrice - dealPrice) / originalPrice) * 100).toInt()
    } else {
        0
    }

private fun hasValidPrice(originalPrice: Double, dealPrice: Double): Boolean =
    dealPrice >= 0.0 && (originalPrice <= 0.0 || dealPrice <= originalPrice)

private fun String.isValidHttpUrl(): Boolean =
    startsWith("https://", ignoreCase = true) || startsWith("http://", ignoreCase = true)

private fun parseBackendTimestamp(value: String): Long? {
    val trimmed = value.trim()
    if (trimmed.isBlank() || trimmed == "null") return null
    trimmed.toLongOrNull()?.let { return it }

    val normalized = trimmed.replace(Regex("\\.(\\d{3})\\d+"), ".$1")
    val patterns = listOf(
        "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        "yyyy-MM-dd'T'HH:mm:ss'Z'",
        "yyyy-MM-dd HH:mm:ss"
    )
    return patterns.firstNotNullOfOrNull { pattern ->
        runCatching {
            SimpleDateFormat(pattern, Locale.US).parse(normalized)?.time
        }.getOrNull()
    }
}
