package com.enjoyfreedeals.app.data.mock

import com.enjoyfreedeals.app.data.model.CategoryModel

object MockCategories {
    val categories = listOf(
        category("electronics", "Electronics", "Smart gadgets, speakers, TVs and accessories", "#E91B23", "#FFD600", 18),
        category("fashion", "Fashion", "Clothing, shoes, bags and accessories", "#006B2E", "#FFD600", 21),
        category("mobile", "Mobile Deals", "Phones, covers, chargers and recharge offers", "#1565C0", "#00BCD4", 12),
        category("beauty", "Beauty", "Skincare, makeup, wellness and free samples", "#D81B60", "#FFD600", 14),
        category("grocery", "Grocery", "Daily staples, fruits and household essentials", "#2E7D32", "#8BC34A", 10),
        category("home", "Home & Kitchen", "Storage, decor, appliances and cookware", "#EF6C00", "#FFD54F", 16),
        category("samples", "Free Samples", "Genuine sample campaigns and trial kits", "#C2185B", "#F8BBD0", 6),
        category("coupons", "Coupons", "Verified coupon codes and extra discounts", "#4527A0", "#90CAF9", 28),
        category("recharge", "Recharge Offers", "Mobile, DTH and bill-payment cashback", "#00838F", "#80DEEA", 8),
        category("bank", "Bank Offers", "Card discounts, EMI and cashback offers", "#37474F", "#FFD600", 11),
        category("student", "Student Deals", "Budget picks and student-friendly offers", "#5D4037", "#FFCC80", 7),
        category("festival", "Festival Deals", "Sale-season and event based offers", "#E91B23", "#FF9800", 19),
        category("travel", "Travel Deals", "Flights, hotels and holiday coupons", "#0277BD", "#B3E5FC", 5),
        category("food", "Food Deals", "Restaurants, delivery and snack offers", "#BF360C", "#FFAB91", 9),
        category("baby", "Baby Products", "Baby care, toys and family essentials", "#AD1457", "#F8BBD0", 4),
        category("gaming", "Gaming", "Consoles, accessories and digital games", "#1E1E1E", "#FFD600", 6)
    )

    private fun category(
        id: String,
        name: String,
        description: String,
        color1: String,
        color2: String,
        count: Int
    ) = CategoryModel(
        categoryId = id,
        categoryName = name,
        categoryIcon = id,
        categoryImage = "",
        description = description,
        gradientColor1 = color1,
        gradientColor2 = color2,
        dealCount = count
    )
}

