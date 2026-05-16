package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.mock.MockDeals
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.utils.Constants
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.tasks.await

class UserRepository(private val context: Context) {
    private val firebaseEnabled: Boolean
        get() = FirebaseApp.getApps(context).isNotEmpty()

    private val firestore: FirebaseFirestore?
        get() = if (firebaseEnabled) FirebaseFirestore.getInstance() else null

    fun getCurrentUserId(): String? =
        if (firebaseEnabled) FirebaseAuth.getInstance().currentUser?.uid else mockUser.userId

    fun getCurrentUserProfile(): Flow<UserModel> {
        val userId = getCurrentUserId() ?: return flowOf(mockUser)
        val db = firestore ?: return flowOf(mockUser)
        return callbackFlow {
            val listener = db.collection(Constants.USERS)
                .document(userId)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        trySend(mockUser)
                        return@addSnapshotListener
                    }
                    val user = snapshot?.toObject(UserModel::class.java) ?: mockUser.copy(userId = userId)
                    trySend(user)
                }
            awaitClose { listener.remove() }
        }
    }

    suspend fun saveUserProfile(user: UserModel) {
        if (firebaseEnabled) {
            firestore?.collection(Constants.USERS)?.document(user.userId)?.set(user)?.await()
        } else {
            mockUser = user
        }
    }

    suspend fun updateUserProfile(user: UserModel) {
        val updated = user.copy(updatedAt = System.currentTimeMillis())
        if (firebaseEnabled) {
            firestore?.collection(Constants.USERS)?.document(updated.userId)?.set(updated)?.await()
        } else {
            mockUser = updated
        }
    }

    suspend fun updateNotificationPreference(enabled: Boolean) {
        updateUserField("notificationEnabled", enabled)
        mockUser = mockUser.copy(notificationEnabled = enabled, updatedAt = System.currentTimeMillis())
    }

    suspend fun updateDarkModePreference(enabled: Boolean) {
        updateUserField("darkModeEnabled", enabled)
        mockUser = mockUser.copy(darkModeEnabled = enabled, updatedAt = System.currentTimeMillis())
    }

    suspend fun addSavedDeal(dealId: String) {
        val userId = getCurrentUserId() ?: return
        if (firebaseEnabled) {
            firestore?.collection(Constants.USERS)?.document(userId)
                ?.update("savedDeals", FieldValue.arrayUnion(dealId), "updatedAt", System.currentTimeMillis())
                ?.await()
        }
        if (!mockUser.savedDeals.contains(dealId)) {
            mockUser = mockUser.copy(savedDeals = mockUser.savedDeals + dealId)
        }
    }

    suspend fun removeSavedDeal(dealId: String) {
        val userId = getCurrentUserId() ?: return
        if (firebaseEnabled) {
            firestore?.collection(Constants.USERS)?.document(userId)
                ?.update("savedDeals", FieldValue.arrayRemove(dealId), "updatedAt", System.currentTimeMillis())
                ?.await()
        }
        mockUser = mockUser.copy(savedDeals = mockUser.savedDeals - dealId)
    }

    suspend fun addSharedDeal(dealId: String) {
        val userId = getCurrentUserId() ?: return
        if (firebaseEnabled) {
            firestore?.collection(Constants.USERS)?.document(userId)
                ?.update("sharedDeals", FieldValue.arrayUnion(dealId), "updatedAt", System.currentTimeMillis())
                ?.await()
        }
        if (!mockUser.sharedDeals.contains(dealId)) {
            mockUser = mockUser.copy(sharedDeals = mockUser.sharedDeals + dealId)
        }
    }

    suspend fun addPriceDropAlert(dealId: String, targetPrice: Double) {
        val userId = getCurrentUserId() ?: return
        val targets = mockUser.priceDropTargetPrices + (dealId to targetPrice)
        if (firebaseEnabled) {
            firestore?.collection(Constants.USERS)?.document(userId)
                ?.update(
                    "priceDropAlerts",
                    FieldValue.arrayUnion(dealId),
                    "priceDropTargetPrices",
                    targets,
                    "updatedAt",
                    System.currentTimeMillis()
                )
                ?.await()
        }
        if (!mockUser.priceDropAlerts.contains(dealId)) {
            mockUser = mockUser.copy(priceDropAlerts = mockUser.priceDropAlerts + dealId)
        }
        mockUser = mockUser.copy(priceDropTargetPrices = targets)
    }

    suspend fun removePriceDropAlert(dealId: String) {
        val userId = getCurrentUserId() ?: return
        val targets = mockUser.priceDropTargetPrices - dealId
        if (firebaseEnabled) {
            firestore?.collection(Constants.USERS)?.document(userId)
                ?.update(
                    "priceDropAlerts",
                    FieldValue.arrayRemove(dealId),
                    "priceDropTargetPrices",
                    targets,
                    "updatedAt",
                    System.currentTimeMillis()
                )
                ?.await()
        }
        mockUser = mockUser.copy(
            priceDropAlerts = mockUser.priceDropAlerts - dealId,
            priceDropTargetPrices = targets
        )
    }

    fun getSavedDeals(): Flow<List<DealModel>> =
        flowOf(MockDeals.deals.filter { mockUser.savedDeals.contains(it.dealId) })

    fun getSharedDeals(): Flow<List<DealModel>> =
        flowOf(MockDeals.deals.filter { mockUser.sharedDeals.contains(it.dealId) })

    private suspend fun updateUserField(field: String, value: Any) {
        val userId = getCurrentUserId() ?: return
        if (firebaseEnabled) {
            firestore?.collection(Constants.USERS)?.document(userId)
                ?.update(field, value, "updatedAt", System.currentTimeMillis())
                ?.await()
        }
    }

    companion object {
        var mockUser = UserModel(
            userId = Constants.MOCK_USER_ID,
            name = "Deal Hunter",
            email = "hunter@enjoyfreedeals.local",
            mobile = "9876543210",
            savedDeals = listOf("amazon-boat-earbuds", "sample-skincare"),
            sharedDeals = listOf("flipkart-realme-phone")
        )
    }
}
