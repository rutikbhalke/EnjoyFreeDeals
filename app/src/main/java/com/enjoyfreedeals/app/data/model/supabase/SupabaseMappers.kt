package com.enjoyfreedeals.app.data.model.supabase

import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.DealImageFallbacks
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.model.PriceStatsModel
import com.enjoyfreedeals.app.data.model.StorePriceModel
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import kotlin.math.roundToInt

fun ActiveDealDto.toDealModel(
    comparisonPrices: List<StorePriceModel> = emptyList(),
    priceStats: ProductPriceStatsDto? = null
): DealModel {
    val price = lowestPrice ?: 0.0
    val mrp = originalPrice ?: price
    val resolvedTitle = title.ifBlank { productName }
    val resolvedImageUrl = firstNotBlank(
        imageUrl,
        camelImageUrl,
        productImageUrl,
        camelProductImageUrl,
        photoUrl,
        thumbnailUrl,
        thumbnail
    )
    val lastUpdatedMillis = lastUpdated.toEpochMillisOrNow()
    val expiresMillis = expiresAt.toEpochMillisOrDefault(System.currentTimeMillis() + DealModel.DEFAULT_EXPIRY_WINDOW)
    return DealModel(
        dealId = offerId,
        productId = productId.ifBlank { offerId },
        title = resolvedTitle,
        description = listOfNotNull(brand, model, categoryName).joinToString(" ").ifBlank {
            "$resolvedTitle from $storeName"
        },
        productImage = resolvedImageUrl.ifBlank { DealImageFallbacks.forDeal(resolvedTitle, categoryName, storeName) },
        originalPrice = mrp,
        discountedPrice = price,
        discountPercent = discountPercent ?: discountPercent(mrp, price),
        storeName = storeName,
        storeLogo = storeLogoUrl.orEmpty(),
        categoryId = categorySlug.ifBlank { categoryName.slugify() },
        categoryName = categoryName,
        dealType = if (isFreeDeal) "FREE" else "DISCOUNT",
        dealUrl = affiliateUrl.orEmpty().ifBlank { productUrl },
        productUrl = productUrl,
        affiliateUrl = affiliateUrl.orEmpty(),
        couponCode = couponCode.orEmpty(),
        isHotDeal = isHotDeal,
        isFreeDeal = isFreeDeal,
        isActive = isAvailable(availability) && expiresMillis > System.currentTimeMillis(),
        isFeatured = isLowestPrice,
        currentPrice = price,
        lowestPrice = priceStats?.minPrice ?: price,
        highestPrice = priceStats?.maxPrice ?: mrp,
        averagePrice = priceStats?.avgPrice ?: price,
        priceCheckedAt = lastUpdatedMillis,
        rating = rating ?: 0.0,
        ratingCount = ratingCount ?: 0,
        reviewCount = reviewCount ?: 0,
        deliveryInfo = deliveryInfo ?: availability?.replace("_", " ") ?: "Live deal",
        availability = availability ?: "in_stock",
        comparisonPrices = comparisonPrices,
        createdAt = lastUpdatedMillis,
        updatedAt = lastUpdatedMillis,
        expiryDate = expiresMillis
    )
}

fun PriceComparisonDto.toStorePriceModel(): StorePriceModel =
    StorePriceModel(
        platform = storeName,
        price = currentPrice ?: 0.0,
        productUrl = productUrl,
        affiliateUrl = affiliateUrl.orEmpty(),
        available = isAvailable(availability),
        deliveryInfo = availability?.replace("_", " ") ?: "Live price",
        rating = rating ?: 0.0,
        ratingCount = ratingCount ?: 0,
        reviewCount = reviewCount ?: 0,
        couponCode = "",
        isLowestPrice = isLowestPrice,
        storeLogoUrl = storeLogoUrl.orEmpty(),
        lastUpdated = lastCheckedAt.toEpochMillisOrNow()
    )

fun PriceHistoryDto.toPricePointModel(): PricePointModel {
    val checkedMillis = checkedAt.toEpochMillisOrDefault(priceCheckedAt.toEpochMillisOrNow())
    val resolvedPrice = price ?: currentPrice ?: 0.0
    return PricePointModel(
        id = id,
        productId = productId,
        storeName = storeName,
        productUrl = productUrl.orEmpty(),
        affiliateUrl = affiliateUrl.orEmpty(),
        priceAmount = resolvedPrice,
        currentPrice = resolvedPrice,
        originalPrice = originalPrice ?: resolvedPrice,
        discountPercentage = discountPercentage ?: discountPercent ?: 0,
        priceDropAmount = priceDropAmount ?: 0.0,
        checkedAt = checkedMillis,
        priceCheckedAt = checkedMillis,
        createdAt = createdAt.toEpochMillisOrDefault(checkedMillis),
        updatedAt = checkedMillis,
        source = "supabase"
    )
}

fun ProductPriceStatsDto.toPriceStatsModel(currentPrice: Double): PriceStatsModel =
    PriceStatsModel(
        currentPrice = currentPrice,
        averagePrice = avgPrice ?: currentPrice,
        highestPrice = maxPrice ?: currentPrice,
        lowestPrice = minPrice ?: currentPrice,
        dropFromAveragePercent = if ((avgPrice ?: 0.0) > 0.0 && currentPrice < (avgPrice ?: 0.0)) {
            ((((avgPrice ?: currentPrice) - currentPrice) / (avgPrice ?: currentPrice)) * 100).roundToInt()
        } else {
            0
        },
        isLowestPriceNow = currentPrice <= (minPrice ?: currentPrice)
    )

private fun discountPercent(originalPrice: Double, currentPrice: Double): Int =
    if (originalPrice > 0.0 && currentPrice in 0.0..originalPrice) {
        (((originalPrice - currentPrice) / originalPrice) * 100).roundToInt()
    } else {
        0
    }

private fun firstNotBlank(vararg values: String?): String =
    values.firstOrNull { !it.isNullOrBlank() }.orEmpty()

private fun String.slugify(): String =
    lowercase(Locale.US)
        .replace("&", "and")
        .replace(Regex("[^a-z0-9]+"), "-")
        .trim('-')

private fun isAvailable(availability: String?): Boolean {
    val normalized = availability.orEmpty().lowercase(Locale.US)
    return normalized.isBlank() ||
        normalized == "in_stock" ||
        normalized == "available" ||
        normalized == "limited_stock"
}

fun String?.toEpochMillisOrNow(): Long = toEpochMillisOrDefault(System.currentTimeMillis())

fun String?.toEpochMillisOrDefault(defaultValue: Long): Long {
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
