package com.enjoyfreedeals.app.data.model

import com.google.firebase.firestore.PropertyName

data class PriceAlertModel(
    @get:PropertyName("id") @set:PropertyName("id")
    var id: String = "",
    @get:PropertyName("user_id") @set:PropertyName("user_id")
    var userId: String = "",
    @get:PropertyName("product_id") @set:PropertyName("product_id")
    var productId: String = "",
    @get:PropertyName("target_price") @set:PropertyName("target_price")
    var targetPrice: Double = 0.0,
    @get:PropertyName("current_price_when_created") @set:PropertyName("current_price_when_created")
    var currentPriceWhenCreated: Double = 0.0,
    @get:PropertyName("alert_status") @set:PropertyName("alert_status")
    var alertStatus: String = "active",
    @get:PropertyName("notification_sent") @set:PropertyName("notification_sent")
    var notificationSent: Boolean = false,
    @get:PropertyName("created_at") @set:PropertyName("created_at")
    var createdAt: Long = System.currentTimeMillis(),
    @get:PropertyName("updated_at") @set:PropertyName("updated_at")
    var updatedAt: Long = System.currentTimeMillis()
)
