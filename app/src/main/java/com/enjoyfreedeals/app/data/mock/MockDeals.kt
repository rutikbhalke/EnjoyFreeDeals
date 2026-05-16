package com.enjoyfreedeals.app.data.mock

import com.enjoyfreedeals.app.data.model.DealModel

object MockDeals {
    val deals = listOf(
        deal("amazon-boat-earbuds", "boAt Bluetooth Earbuds", "Deep bass wireless earbuds with fast charging case.", 3999.0, 1599.0, 60, "Amazon", "electronics", "Electronics", "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80", "https://www.amazon.in/", "BOAT60", hot = true, featured = true),
        deal("flipkart-realme-phone", "Realme Smartphone", "5G smartphone offer with exchange and bank savings.", 16999.0, 13599.0, 20, "Flipkart", "mobile", "Mobile Deals", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80", "https://www.flipkart.com/", "REALME20", hot = true, featured = true),
        deal("meesho-kurti", "Women Kurti", "Printed cotton kurti with festive sale pricing.", 1299.0, 389.0, 70, "Meesho", "fashion", "Fashion", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80", "https://www.meesho.com/", "MEESHO70"),
        deal("myntra-shoes", "Sports Shoes", "Lightweight running shoes with extra coupon savings.", 3499.0, 1575.0, 55, "Myntra", "fashion", "Fashion", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80", "https://www.myntra.com/", "RUN55", hot = true),
        deal("snapdeal-storage", "Kitchen Storage Set", "Airtight storage containers for daily kitchen use.", 1199.0, 659.0, 45, "Snapdeal", "home", "Home & Kitchen", "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=900&q=80", "https://www.snapdeal.com/", "KITCHEN45"),
        deal("ajio-tshirt", "Men's T-Shirt", "Premium cotton t-shirt with casual weekend pricing.", 999.0, 499.0, 50, "Ajio", "fashion", "Fashion", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80", "https://www.ajio.com/", "AJIO50"),
        deal("tatacliq-watch", "Smartwatch", "Fitness smartwatch with notifications and long battery life.", 5999.0, 3599.0, 40, "TataCliq", "electronics", "Electronics", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=900&q=80", "https://www.tatacliq.com/", "WATCH40", featured = true),
        deal("nykaa-beauty", "Beauty Combo", "Skincare and makeup essentials combo offer.", 1999.0, 1299.0, 35, "Nykaa", "beauty", "Beauty", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80", "https://www.nykaa.com/", "BEAUTY35"),
        deal("croma-speaker", "Bluetooth Speaker", "Portable speaker with punchy sound and compact design.", 2499.0, 1749.0, 30, "Croma", "electronics", "Electronics", "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80", "https://www.croma.com/", "CROMA30"),
        deal("jiomart-grocery", "Grocery Combo", "Monthly grocery saver pack with staples and snacks.", 1999.0, 1499.0, 25, "JioMart", "grocery", "Grocery", "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80", "https://www.jiomart.com/", "GROCERY25"),
        deal("bigbasket-fruit", "Fruit Basket", "Fresh fruit basket with seasonal produce.", 999.0, 799.0, 20, "BigBasket", "grocery", "Grocery", "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=80", "https://www.bigbasket.com/", "FRESH20"),
        deal("sample-skincare", "Skincare Sample Kit", "Free sample kit for skincare discovery.", 499.0, 0.0, 100, "Free Sample", "samples", "Free Samples", "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80", "https://www.nykaa.com/", "", hot = true, free = true, featured = true),
        deal("reliance-tv", "Smart TV Exchange Bonus", "Extra bank cashback on premium smart TVs.", 42999.0, 34999.0, 19, "Reliance Digital", "electronics", "Electronics", "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80", "https://www.reliancedigital.in/", "TVCASH"),
        deal("bank-cashback", "Bank Cashback Offer", "Flat cashback on credit card shopping weekends.", 1000.0, 750.0, 25, "Bank Offer", "bank", "Bank Offers", "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80", "https://www.amazon.in/", "BANK25", hot = true)
    )

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
    ) = DealModel(
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
        dealUrl = url,
        couponCode = coupon,
        isHotDeal = hot,
        isFreeDeal = free,
        isFeatured = featured,
        shareCount = (5..80).random(),
        savedCount = (8..160).random()
    )
}

