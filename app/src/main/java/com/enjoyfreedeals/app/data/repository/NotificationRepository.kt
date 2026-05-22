package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.NotificationModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import com.enjoyfreedeals.app.data.remote.dataArray
import com.enjoyfreedeals.app.data.remote.toJsonObjects
import com.enjoyfreedeals.app.data.remote.toNotificationModel
import com.enjoyfreedeals.app.utils.Constants
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import java.net.URLEncoder

class NotificationRepository(private val context: Context) {
    private val backendClient = BackendClient()
    private val firebaseEnabled: Boolean
        get() = FirebaseApp.getApps(context).isNotEmpty()

    fun getUserNotifications(userId: String): Flow<List<NotificationModel>> = flow {
        if (userId.isBlank() || userId == Constants.MOCK_USER_ID) {
            emit(emptyList())
            return@flow
        }

        val notifications = backendClient.get("/api/notifications/${userId.urlEncode()}", AuthSessionStore.accessToken(context))
            .dataArray()
            .toJsonObjects()
            .map { it.toNotificationModel() }

        emit(notifications)
    }

    fun getUnreadNotificationCount(userId: String): Flow<Int> = flow {
        getUserNotifications(userId).collect { notifications ->
            emit(notifications.count { !it.isRead })
        }
    }

    suspend fun markNotificationAsRead(notificationId: String) {
        if (notificationId.isBlank()) return
        backendClient.put(
            "/api/notifications/${notificationId.urlEncode()}/read",
            org.json.JSONObject(),
            AuthSessionStore.accessToken(context)
        )
    }

    suspend fun markAllNotificationsAsRead(userId: String) {
        if (userId.isBlank() || userId == Constants.MOCK_USER_ID) return
        backendClient.put(
            "/api/notifications/user/${userId.urlEncode()}/read-all",
            org.json.JSONObject(),
            AuthSessionStore.accessToken(context)
        )
    }

    suspend fun saveFcmToken(userId: String, token: String) {
        UserRepository.mockUser = UserRepository.mockUser.copy(fcmToken = token)
    }

    suspend fun getAndSaveFcmToken(userId: String): String {
        val token = if (firebaseEnabled) {
            FirebaseMessaging.getInstance().token.await()
        } else {
            "local-notification-token"
        }
        saveFcmToken(userId, token)
        return token
    }

    private fun String.urlEncode(): String =
        URLEncoder.encode(this, Charsets.UTF_8.name())
}
