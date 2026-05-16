package com.enjoyfreedeals.app.data.model

data class BlogModel(
    var blogId: String = "",
    var title: String = "",
    var image: String = "",
    var shortDescription: String = "",
    var fullContent: String = "",
    var author: String = "BizFlow Team",
    var isPublished: Boolean = true,
    var createdAt: Long = System.currentTimeMillis(),
    var updatedAt: Long = System.currentTimeMillis()
)

