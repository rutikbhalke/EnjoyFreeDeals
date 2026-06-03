package com.enjoyfreedeals.app.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.enjoyfreedeals.app.data.mock.MockDeals
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import com.enjoyfreedeals.app.data.remote.dataArray
import com.enjoyfreedeals.app.data.remote.dataObject
import com.enjoyfreedeals.app.data.remote.toDealModel
import com.enjoyfreedeals.app.data.remote.toJsonObjects
import com.enjoyfreedeals.app.data.remote.toUserModel
import com.enjoyfreedeals.app.utils.Constants
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.URLEncoder

class UserRepository(private val context: Context) {
    private val backendClient = BackendClient()

    fun getCurrentUserId(): String =
        AuthSessionStore.currentUserId(context) ?: mockUser.userId

    fun getCurrentUserProfile(): Flow<UserModel> = callbackFlow {
        suspend fun emitCurrentUser() {
            val sessionUser = AuthSessionStore.currentUser(context)
            if (sessionUser == null) {
                trySend(mockUser)
                return
            }

            val user = runCatching {
                backendClient.get("/api/profiles/${sessionUser.userId.urlEncode()}", AuthSessionStore.accessToken(context))
                    .dataObject()
                    .toUserModel(sessionUser)
            }.getOrElse { sessionUser }

            mockUser = mergeLocalUserState(user)
            trySend(mockUser)
        }

        val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ ->
            launch { emitCurrentUser() }
        }

        launch { emitCurrentUser() }
        AuthSessionStore.registerListener(context, listener)
        awaitClose {
            AuthSessionStore.unregisterListener(context, listener)
        }
    }

    fun updateNotificationPreference(enabled: Boolean) {
        mockUser = mockUser.copy(notificationEnabled = enabled, updatedAt = System.currentTimeMillis())
        AuthSessionStore.updateUser(context, mockUser)
    }

    fun updateDarkModePreference(enabled: Boolean) {
        mockUser = mockUser.copy(darkModeEnabled = enabled, updatedAt = System.currentTimeMillis())
        AuthSessionStore.updateUser(context, mockUser)
    }

    suspend fun addSavedDeal(dealId: String) {
        val userId = getCurrentUserId()
        backendClient.post(
            "/api/wishlist",
            JSONObject()
                .put("userId", userId)
                .put("dealId", dealId),
            AuthSessionStore.accessToken(context)
        )
        if (!mockUser.savedDeals.contains(dealId)) {
            mockUser = mockUser.copy(savedDeals = mockUser.savedDeals + dealId)
        }
    }

    suspend fun removeSavedDeal(dealId: String) {
        val userId = getCurrentUserId()
        runCatching {
            backendClient.delete(
                "/api/wishlist/${userId.urlEncode()}/${dealId.urlEncode()}",
                AuthSessionStore.accessToken(context)
            )
        }
        mockUser = mockUser.copy(savedDeals = mockUser.savedDeals - dealId)
    }

    suspend fun addSharedDeal(dealId: String) {
        val userId = getCurrentUserId()
        backendClient.post(
            "/api/shared-deals",
            JSONObject()
                .put("userId", userId)
                .put("dealId", dealId)
                .put("shareChannel", "android"),
            AuthSessionStore.accessToken(context)
        )
        mockUser = mockUser.copy(sharedDeals = (mockUser.sharedDeals + dealId).distinct())
    }

    fun addPriceDropAlert(dealId: String, targetPrice: Double) {
        val targets = mockUser.priceDropTargetPrices + (dealId to targetPrice)
        if (!mockUser.priceDropAlerts.contains(dealId)) {
            mockUser = mockUser.copy(priceDropAlerts = mockUser.priceDropAlerts + dealId)
        }
        mockUser = mockUser.copy(priceDropTargetPrices = targets)
        AuthSessionStore.updateUser(context, mockUser)
    }

    fun removePriceDropAlert(dealId: String) {
        mockUser = mockUser.copy(
            priceDropAlerts = mockUser.priceDropAlerts - dealId,
            priceDropTargetPrices = mockUser.priceDropTargetPrices - dealId
        )
        AuthSessionStore.updateUser(context, mockUser)
    }

    fun getSavedDeals(): Flow<List<DealModel>> = flow {
        val userId = getCurrentUserId()
        if (userId == Constants.MOCK_USER_ID) {
            emit(MockDeals.deals.filter { mockUser.savedDeals.contains(it.dealId) })
            return@flow
        }

        val deals = runCatching {
            backendClient.get("/api/wishlist/${userId.urlEncode()}", AuthSessionStore.accessToken(context))
                .dataArray()
                .toJsonObjects()
                .mapNotNull { it.optJSONObject("deal")?.toDealModel() }
        }.getOrThrow()

        mockUser = mockUser.copy(savedDeals = deals.map { it.dealId })
        emit(deals)
    }

    fun getSharedDeals(): Flow<List<DealModel>> =
        flow {
            val userId = getCurrentUserId()
            if (userId == Constants.MOCK_USER_ID) {
                emit(emptyList())
                return@flow
            }

            val deals = runCatching {
                backendClient.get("/api/shared-deals/${userId.urlEncode()}", AuthSessionStore.accessToken(context))
                    .dataArray()
                    .toJsonObjects()
                    .mapNotNull { it.optJSONObject("deal")?.toDealModel() }
            }.getOrThrow()

            mockUser = mockUser.copy(sharedDeals = deals.map { it.dealId })
            emit(deals)
        }

    private fun mergeLocalUserState(user: UserModel): UserModel =
        user.copy(
            savedDeals = mockUser.savedDeals,
            sharedDeals = mockUser.sharedDeals,
            priceDropAlerts = mockUser.priceDropAlerts,
            priceDropTargetPrices = mockUser.priceDropTargetPrices,
            notificationEnabled = mockUser.notificationEnabled,
            darkModeEnabled = mockUser.darkModeEnabled,
            fcmToken = mockUser.fcmToken
        )

    private fun String.urlEncode(): String =
        URLEncoder.encode(this, Charsets.UTF_8.name())

    companion object {
        var mockUser = UserModel(
            userId = Constants.MOCK_USER_ID,
            name = "Deal Hunter",
            email = "hunter@enjoyfreedeals.local",
            mobile = "9876543210",
            savedDeals = listOf("amazon-boat-earbuds", "sample-skincare"),
            sharedDeals = emptyList()
        )
    }
}
