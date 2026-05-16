package com.enjoyfreedeals.app.data.model

data class NotificationModel(
    var notificationId: String = "",
    var title: String = "",
    var message: String = "",
    var image: String = "",
    var dealId: String = "",
    var targetUrl: String = "",
    var notificationType: String = NotificationType.SYSTEM.name,
    var isRead: Boolean = false,
    var userId: String = "",
    var createdAt: Long = System.currentTimeMillis()
)

enum class NotificationType {
    HOT_DEAL,
    FREE_DEAL,
    EXPIRING_SOON,
    PRICE_DROP,
    COUPON,
    BLOG,
    SYSTEM
}
