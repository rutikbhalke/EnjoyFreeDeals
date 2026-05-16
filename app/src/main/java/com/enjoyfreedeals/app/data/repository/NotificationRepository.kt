package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.mock.MockDeals
import com.enjoyfreedeals.app.data.model.NotificationModel
import com.enjoyfreedeals.app.data.model.NotificationType
import com.enjoyfreedeals.app.utils.Constants
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class NotificationRepository(private val context: Context) {
    private val firebaseEnabled: Boolean
        get() = FirebaseApp.getApps(context).isNotEmpty()

    private val firestore: FirebaseFirestore?
        get() = if (firebaseEnabled) FirebaseFirestore.getInstance() else null

    fun getUserNotifications(userId: String): Flow<List<NotificationModel>> {
        val mock = mockNotifications(userId)
        val db = firestore ?: return flowOf(mock)
        return callbackFlow {
            val listener = db.collection(Constants.NOTIFICATIONS)
                .whereEqualTo("userId", userId)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        trySend(mock)
                        return@addSnapshotListener
                    }
                    trySend(snapshot?.documents?.mapNotNull { it.toObject(NotificationModel::class.java) }.orEmpty().ifEmpty { mock })
                }
            awaitClose { listener.remove() }
        }
    }

    fun getUnreadNotificationCount(userId: String): Flow<Int> = callbackFlow {
        val flow = getUserNotifications(userId)
        val job = launch {
            flow.collect { trySend(it.count { notification -> !notification.isRead }) }
        }
        awaitClose { job.cancel() }
    }

    suspend fun markNotificationAsRead(notificationId: String) {
        if (firebaseEnabled) {
            firestore?.collection(Constants.NOTIFICATIONS)?.document(notificationId)
                ?.update("isRead", true)
                ?.await()
        }
    }

    suspend fun markAllNotificationsAsRead(userId: String) {
        if (firebaseEnabled) {
            val snapshot = firestore?.collection(Constants.NOTIFICATIONS)
                ?.whereEqualTo("userId", userId)
                ?.get()
                ?.await()
            snapshot?.documents?.forEach { it.reference.update("isRead", true).await() }
        }
    }

    suspend fun saveFcmToken(userId: String, token: String) {
        UserRepository.mockUser = UserRepository.mockUser.copy(fcmToken = token)
        if (firebaseEnabled) {
            firestore?.collection(Constants.USERS)?.document(userId)
                ?.update("fcmToken", token, "updatedAt", System.currentTimeMillis())
                ?.await()
        }
    }

    suspend fun getAndSaveFcmToken(userId: String): String {
        val token = if (firebaseEnabled) {
            FirebaseMessaging.getInstance().token.await()
        } else {
            "mock-fcm-token"
        }
        saveFcmToken(userId, token)
        return token
    }

    private fun mockNotifications(userId: String): List<NotificationModel> = listOf(
        NotificationModel(
            notificationId = "hot-amazon",
            title = "Hot deal alert",
            message = "boAt Bluetooth Earbuds are now 60% off.",
            image = MockDeals.deals.first().productImage,
            dealId = "amazon-boat-earbuds",
            targetUrl = MockDeals.deals.first().redirectUrl,
            notificationType = NotificationType.HOT_DEAL.name,
            isRead = false,
            userId = userId
        ),
        NotificationModel(
            notificationId = "free-sample",
            title = "Free sample live",
            message = "A skincare sample kit is available for free right now.",
            image = MockDeals.deals.first { it.isFreeDeal }.productImage,
            dealId = "sample-skincare",
            targetUrl = MockDeals.deals.first { it.isFreeDeal }.redirectUrl,
            notificationType = NotificationType.FREE_DEAL.name,
            isRead = true,
            userId = userId
        ),
        NotificationModel(
            notificationId = "price-drop-watch",
            title = "Price drop alert",
            message = "Smartwatch reached a new low price. Check the price graph now.",
            image = MockDeals.deals.first { it.dealId == "tatacliq-watch" }.productImage,
            dealId = "tatacliq-watch",
            targetUrl = MockDeals.deals.first { it.dealId == "tatacliq-watch" }.redirectUrl,
            notificationType = NotificationType.PRICE_DROP.name,
            isRead = false,
            userId = userId
        )
    )
}
