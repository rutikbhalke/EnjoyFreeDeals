package com.enjoyfreedeals.app.ui.profile

import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PriceAlertModel
import com.enjoyfreedeals.app.data.model.RecentlyViewedDealModel
import com.enjoyfreedeals.app.data.model.SavedDealModel
import com.enjoyfreedeals.app.data.model.SharedDealModel

internal fun SavedDealModel.toDealModel(): DealModel =
    DealModel(
        dealId = dealId,
        productId = dealId,
        title = productTitle,
        storeName = platform,
        currentPrice = dealPrice,
        discountedPrice = dealPrice,
        dealPrice = dealPrice,
        originalPrice = originalPrice ?: 0.0,
        discountPercent = discountPercent?.toInt() ?: 0,
        productUrl = productUrl,
        dealUrl = productUrl,
        affiliateUrl = productUrl,
        imageUrl = imageUrl,
        productImage = imageUrl
    )

internal fun SharedDealModel.toDealModel(): DealModel =
    DealModel(
        dealId = dealId,
        productId = dealId,
        title = productTitle,
        storeName = platform,
        currentPrice = dealPrice,
        discountedPrice = dealPrice,
        dealPrice = dealPrice,
        productUrl = productUrl,
        dealUrl = productUrl,
        affiliateUrl = productUrl,
        imageUrl = imageUrl,
        productImage = imageUrl
    )

internal fun PriceAlertModel.toDealModel(): DealModel =
    DealModel(
        dealId = dealId,
        productId = dealId,
        title = productTitle,
        storeName = platform,
        currentPrice = currentPrice,
        discountedPrice = currentPrice,
        dealPrice = currentPrice,
        originalPrice = originalPrice ?: 0.0,
        productUrl = productUrl,
        dealUrl = productUrl,
        affiliateUrl = productUrl,
        imageUrl = imageUrl,
        productImage = imageUrl
    )

internal fun RecentlyViewedDealModel.toDealModel(): DealModel =
    DealModel(
        dealId = dealId,
        productId = dealId,
        title = productTitle,
        storeName = platform,
        currentPrice = dealPrice,
        discountedPrice = dealPrice,
        dealPrice = dealPrice,
        originalPrice = originalPrice ?: 0.0,
        discountPercent = discountPercent?.toInt() ?: 0,
        productUrl = productUrl,
        dealUrl = productUrl,
        affiliateUrl = productUrl,
        imageUrl = imageUrl,
        productImage = imageUrl
    )
