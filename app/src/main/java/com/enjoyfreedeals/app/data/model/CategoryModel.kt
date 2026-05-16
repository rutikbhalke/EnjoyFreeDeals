package com.enjoyfreedeals.app.data.model

data class CategoryModel(
    var categoryId: String = "",
    var categoryName: String = "",
    var categoryIcon: String = "",
    var categoryImage: String = "",
    var description: String = "",
    var gradientColor1: String = "#E91B23",
    var gradientColor2: String = "#006B2E",
    var isActive: Boolean = true,
    var dealCount: Int = 0,
    var createdAt: Long = System.currentTimeMillis()
)

