package com.enjoyfreedeals.app.data.model

object DealImageFallbacks {
    private const val ELECTRONICS = "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80"
    private const val MOBILE = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
    private const val FASHION = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"
    private const val SHOES = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"
    private const val HOME = "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=900&q=80"
    private const val GROCERY = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80"
    private const val BEAUTY = "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80"
    private const val LAPTOP = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"
    private const val GENERAL = "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80"

    fun forDeal(title: String, category: String = "", storeName: String = ""): String {
        val text = "$title $category $storeName".lowercase()
        return when {
            text.containsAny("phone", "mobile", "smartphone") -> MOBILE
            text.containsAny("shoe", "sneaker", "footwear") -> SHOES
            text.containsAny("shirt", "t-shirt", "kurti", "dress", "fashion", "jeans", "saree") -> FASHION
            text.containsAny("grocery", "fruit", "food", "snack", "tea", "coffee") -> GROCERY
            text.containsAny("beauty", "skin", "makeup", "cosmetic") -> BEAUTY
            text.containsAny("kitchen", "home", "storage", "container") -> HOME
            text.containsAny("laptop", "student", "backpack", "bag") -> LAPTOP
            text.containsAny("earbud", "speaker", "watch", "charger", "camera", "tablet", "headphone") -> ELECTRONICS
            else -> GENERAL
        }
    }
}

private fun String.containsAny(vararg tokens: String): Boolean =
    tokens.any { contains(it) }
