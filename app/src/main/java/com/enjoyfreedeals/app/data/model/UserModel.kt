package com.enjoyfreedeals.app.data.model

data class UserModel(
    var userId: String = "",
    var name: String = "",
    var email: String = "",
    var mobile: String = "",
    var profileImage: String = "",
    var savedDeals: List<String> = emptyList(),
    var sharedDeals: List<String> = emptyList(),
    var priceDropAlerts: List<String> = emptyList(),
    var priceDropTargetPrices: Map<String, Double> = emptyMap(),
    var notificationEnabled: Boolean = true,
    var darkModeEnabled: Boolean = false,
    var fcmToken: String = "",
    var createdAt: Long = System.currentTimeMillis(),
    var updatedAt: Long = System.currentTimeMillis()
)
