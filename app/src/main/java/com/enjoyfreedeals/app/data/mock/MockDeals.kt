package com.enjoyfreedeals.app.data.mock

import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PriceComparisonProductModel
import com.enjoyfreedeals.app.data.model.StorePriceModel

object MockDeals {
    val deals = listOf(
        deal("amazon-boat-earbuds", "boAt Bluetooth Earbuds", "Deep bass wireless earbuds with fast charging case.", 3999.0, 1599.0, 60, "Amazon", "electronics", "Electronics", "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80", "https://www.amazon.in/dp/B0CBOAT60", "BOAT60", hot = true, featured = true),
        deal("flipkart-realme-phone", "Realme Smartphone", "5G smartphone offer with exchange and bank savings.", 16999.0, 13599.0, 20, "Flipkart", "mobile", "Mobile Deals", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80", "https://www.flipkart.com/realme-5g-smartphone/p/itmrealme20", "REALME20", hot = true, featured = true),
        deal("meesho-kurti", "Women Kurti", "Printed cotton kurti with festive sale pricing.", 1299.0, 389.0, 70, "Meesho", "fashion", "Fashion", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80", "https://www.meesho.com/women-printed-cotton-kurti/p/meesho70", "MEESHO70"),
        deal("myntra-shoes", "Sports Shoes", "Lightweight running shoes with extra coupon savings.", 3499.0, 1575.0, 55, "Myntra", "fashion", "Fashion", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80", "https://www.myntra.com/sports-shoes/example-running-shoes/123456/buy", "RUN55", hot = true),
        deal("snapdeal-storage", "Kitchen Storage Set", "Airtight storage containers for daily kitchen use.", 1199.0, 659.0, 45, "Snapdeal", "home", "Home & Kitchen", "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=900&q=80", "https://www.snapdeal.com/product/airtight-kitchen-storage-set/576460752303", "KITCHEN45"),
        deal("ajio-tshirt", "Men's T-Shirt", "Premium cotton t-shirt with casual weekend pricing.", 999.0, 499.0, 50, "Ajio", "fashion", "Fashion", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80", "https://www.ajio.com/cotton-crew-neck-tshirt/p/ajio50", "AJIO50"),
        deal("tatacliq-watch", "Smartwatch", "Fitness smartwatch with notifications and long battery life.", 5999.0, 3599.0, 40, "TataCliq", "electronics", "Electronics", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=900&q=80", "https://www.tatacliq.com/fitness-smartwatch-with-calling/p-mp000000watch40", "WATCH40", featured = true),
        deal("nykaa-beauty", "Beauty Combo", "Skincare and makeup essentials combo offer.", 1999.0, 1299.0, 35, "Nykaa", "beauty", "Beauty", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80", "https://www.nykaa.com/beauty-essentials-combo/p/beauty35", "BEAUTY35"),
        deal("croma-speaker", "Bluetooth Speaker", "Portable speaker with punchy sound and compact design.", 2499.0, 1749.0, 30, "Croma", "electronics", "Electronics", "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80", "https://www.croma.com/portable-bluetooth-speaker/p/123456", "CROMA30"),
        deal("jiomart-grocery", "Grocery Combo", "Monthly grocery saver pack with staples and snacks.", 1999.0, 1499.0, 25, "JioMart", "grocery", "Grocery", "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80", "https://www.jiomart.com/p/groceries/monthly-grocery-combo/590001", "GROCERY25"),
        deal("bigbasket-fruit", "Fruit Basket", "Fresh fruit basket with seasonal produce.", 999.0, 799.0, 20, "BigBasket", "grocery", "Grocery", "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=80", "https://www.bigbasket.com/pd/40123456/fresh-seasonal-fruit-basket/", "FRESH20"),
        deal("laptop-bag", "Laptop Bag", "Water-resistant office laptop backpack with organizer pockets.", 1999.0, 899.0, 55, "Amazon", "fashion", "Fashion", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80", "https://www.amazon.in/dp/BAGDEAL55", "BAG55", hot = true),
        deal("sample-skincare", "Skincare Sample Kit", "Free sample kit for skincare discovery.", 499.0, 0.0, 100, "Free Sample", "samples", "Free Samples", "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80", "https://www.nykaa.com/skincare-sample-kit/p/sample-free", "", hot = true, free = true, featured = true),
        deal("recharge-offer", "Recharge Offer", "Mobile recharge cashback with instant coupon savings.", 399.0, 299.0, 25, "JioMart", "recharge", "Recharge Offers", "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80", "https://www.jiomart.com/recharge/mobile-offer/recharge25", "RECHARGE25"),
        deal("student-laptop", "Student Laptop Deal", "Lightweight laptop with student exchange and bank discount.", 52999.0, 44999.0, 15, "Croma", "student", "Student Deals", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80", "https://www.croma.com/student-laptop-deal/p/243156", "STUDENT15", featured = true),
        deal("festival-fashion", "Festival Fashion Deal", "Ethnic festive fashion bundle with stackable coupon.", 2999.0, 1199.0, 60, "Myntra", "festival", "Festival Deals", "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80", "https://www.myntra.com/festival-fashion-deal/987654/buy", "FEST60", hot = true),
        deal("reliance-tv", "Smart TV Exchange Bonus", "Extra bank cashback on premium smart TVs.", 42999.0, 34999.0, 19, "Reliance Digital", "electronics", "Electronics", "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80", "https://www.reliancedigital.in/smart-tv-exchange-bonus/p/491234567", "TVCASH"),
        deal("bank-cashback", "Bank Cashback Offer", "Flat cashback on credit card shopping weekends.", 1000.0, 750.0, 25, "Bank Offer", "bank", "Bank Offers", "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80", "https://www.amazon.in/l/credit-card-bank-cashback-offers?deal=bank25", "BANK25", hot = true)
    )

    val priceComparisonProducts: List<PriceComparisonProductModel> = deals.map { deal ->
        PriceComparisonProductModel(
            productId = deal.dealId,
            productName = deal.title,
            imageUrl = deal.productImage,
            category = deal.categoryName,
            originalPrice = deal.originalPrice,
            lowestPrice = deal.lowestStorePrice?.price ?: deal.effectivePrice,
            discountPercent = deal.discountPercent,
            ecommercePlatformPrices = deal.comparisonPrices,
            productUrl = deal.productUrl,
            storeName = deal.lowestStorePrice?.platform ?: deal.storeName,
            couponCode = deal.couponCode,
            rating = deal.rating,
            isHotDeal = deal.isHotDeal,
            isFreeDeal = deal.isFreeDeal,
            lastUpdated = deal.priceCheckedAt
        )
    }

    private fun deal(
        id: String,
        title: String,
        description: String,
        originalPrice: Double,
        discountedPrice: Double,
        discountPercent: Int,
        store: String,
        categoryId: String,
        categoryName: String,
        image: String,
        url: String,
        coupon: String,
        hot: Boolean = false,
        free: Boolean = false,
        featured: Boolean = false
    ): DealModel {
        val now = System.currentTimeMillis()
        val affiliateUrl = buildAffiliateUrl(url, id)
        val currentPrice = if (free) 0.0 else discountedPrice
        val averagePrice = if (free) 0.0 else (originalPrice + currentPrice) / 2.0
        val comparisonPrices = buildComparisonPrices(
            dealId = id,
            selectedStore = store,
            selectedUrl = url,
            selectedCoupon = coupon,
            currentPrice = currentPrice,
            originalPrice = originalPrice,
            categoryId = categoryId,
            now = now
        )
        val lowestPrice = comparisonPrices.filter { it.available }.minOfOrNull { it.price } ?: currentPrice
        return DealModel(
            dealId = id,
            title = title,
            description = description,
            productImage = image,
            originalPrice = originalPrice,
            discountedPrice = discountedPrice,
            discountPercent = discountPercent,
            storeName = store,
            storeLogo = "",
            categoryId = categoryId,
            categoryName = categoryName,
            dealType = if (free) "FREE_DEAL" else if (coupon.isNotBlank()) "COUPON" else "DISCOUNT",
            dealUrl = affiliateUrl,
            productUrl = url,
            affiliateUrl = affiliateUrl,
            couponCode = coupon,
            isHotDeal = hot,
            isFreeDeal = free,
            isFeatured = featured,
            shareCount = (5..80).random(),
            savedCount = (8..160).random(),
            currentPrice = lowestPrice,
            lowestPrice = lowestPrice,
            highestPrice = originalPrice,
            averagePrice = averagePrice,
            priceCheckedAt = now,
            rating = (38..49).random() / 10.0,
            deliveryInfo = if (free) "Instant claim" else listOf("Free delivery", "Delivery in 2 days", "Prime delivery", "Express delivery").random(),
            comparisonPrices = comparisonPrices,
            createdAt = now - (1..7).random() * 24L * 60L * 60L * 1000L,
            updatedAt = now
        )
    }

    private fun buildAffiliateUrl(productUrl: String, dealId: String): String {
        val separator = if (productUrl.contains("?")) "&" else "?"
        return "$productUrl${separator}affid=enjoyfreedeals&utm_source=app&utm_campaign=$dealId"
    }

    private fun buildComparisonPrices(
        dealId: String,
        selectedStore: String,
        selectedUrl: String,
        selectedCoupon: String,
        currentPrice: Double,
        originalPrice: Double,
        categoryId: String,
        now: Long
    ): List<StorePriceModel> {
        val stores = listOf("Amazon", "Flipkart", "Snapdeal", "Meesho", "Myntra", "Ajio", "TataCliq", "Croma", "Nykaa")
        val offsets = listOf(100.0, 50.0, 180.0, -100.0, 130.0, 90.0, 200.0, 150.0, 120.0)
        return stores.mapIndexed { index, platform ->
            val available = platform == selectedStore || categoryId !in listOf("bank", "recharge") && index % 4 != 2
            val price = if (platform == selectedStore) currentPrice else (currentPrice + offsets[index]).coerceAtLeast(if (currentPrice <= 0.0) 0.0 else 99.0)
            val productUrl = if (platform == selectedStore) selectedUrl else storeProductUrl(platform, dealId)
            StorePriceModel(
                platform = platform,
                price = price.coerceAtMost(originalPrice),
                productUrl = productUrl,
                affiliateUrl = buildAffiliateUrl(productUrl, "$dealId-${platform.lowercase()}"),
                available = available,
                deliveryInfo = if (available) listOf("Free delivery", "2 day delivery", "Fast delivery").random() else "Not available",
                rating = (36..49).random() / 10.0,
                couponCode = if (platform == selectedStore) selectedCoupon else "",
                lastUpdated = now
            )
        }
    }

    private fun storeProductUrl(platform: String, dealId: String): String = when (platform) {
        "Amazon" -> "https://www.amazon.in/dp/${dealId.take(10).uppercase()}"
        "Flipkart" -> "https://www.flipkart.com/${dealId}/p/itm${dealId.take(8)}"
        "Snapdeal" -> "https://www.snapdeal.com/product/$dealId/576460752303"
        "Meesho" -> "https://www.meesho.com/$dealId/p/${dealId.takeLast(6)}"
        "Myntra" -> "https://www.myntra.com/${dealId}/123456/buy"
        "Ajio" -> "https://www.ajio.com/$dealId/p/460000"
        "TataCliq" -> "https://www.tatacliq.com/$dealId/p-mp000000"
        "Croma" -> "https://www.croma.com/$dealId/p/123456"
        "Nykaa" -> "https://www.nykaa.com/$dealId/p/beauty"
        else -> "https://www.mywebz.in/deals/$dealId"
    }
}
