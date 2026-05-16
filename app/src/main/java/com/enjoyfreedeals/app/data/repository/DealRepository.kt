package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.mock.MockDeals
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.utils.Constants
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.tasks.await

class DealRepository(private val context: Context) {
    private val userRepository = UserRepository(context)
    private val firebaseEnabled: Boolean
        get() = FirebaseApp.getApps(context).isNotEmpty()

    private val firestore: FirebaseFirestore?
        get() = if (firebaseEnabled) FirebaseFirestore.getInstance() else null

    fun getAllActiveDeals(): Flow<List<DealModel>> {
        val db = firestore ?: return flowOf(MockDeals.deals.filter { it.isActive })
        return callbackFlow {
            val listener = db.collection(Constants.DEALS)
                .whereEqualTo("isActive", true)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        trySend(MockDeals.deals)
                        return@addSnapshotListener
                    }
                    val deals = snapshot?.documents?.mapNotNull { it.toObject(DealModel::class.java) }
                        .orEmpty()
                    trySend(deals.ifEmpty { MockDeals.deals })
                }
            awaitClose { listener.remove() }
        }
    }

    fun getDealsByCategory(categoryId: String): Flow<List<DealModel>> {
        val db = firestore ?: return flowOf(MockDeals.deals.filter { it.categoryId == categoryId && it.isActive })
        return callbackFlow {
            val listener = db.collection(Constants.DEALS)
                .whereEqualTo("categoryId", categoryId)
                .whereEqualTo("isActive", true)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        trySend(MockDeals.deals.filter { it.categoryId == categoryId })
                        return@addSnapshotListener
                    }
                    trySend(snapshot?.documents?.mapNotNull { it.toObject(DealModel::class.java) }.orEmpty())
                }
            awaitClose { listener.remove() }
        }
    }

    fun getSavedDeals(): Flow<List<DealModel>> = userRepository.getSavedDeals()

    fun getSharedDeals(): Flow<List<DealModel>> = userRepository.getSharedDeals()

    suspend fun saveDeal(dealId: String) {
        userRepository.addSavedDeal(dealId)
        incrementDealCounter(dealId, "savedCount")
    }

    suspend fun removeSavedDeal(dealId: String) {
        userRepository.removeSavedDeal(dealId)
    }

    suspend fun shareDeal(dealId: String) {
        userRepository.addSharedDeal(dealId)
        incrementDealCounter(dealId, "shareCount")
    }

    suspend fun incrementDealCounter(dealId: String, field: String) {
        if (firebaseEnabled) {
            firestore?.collection(Constants.DEALS)?.document(dealId)
                ?.update(field, FieldValue.increment(1))
                ?.await()
        }
    }

    companion object {
        fun filterAndSortDeals(
            deals: List<DealModel>,
            query: String = "",
            storeFilter: String = "All",
            sortOption: String = "Newest Deals"
        ): List<DealModel> {
            val filtered = deals.filter { deal ->
                val matchesStore = storeFilter == "All" || deal.storeName.equals(storeFilter, ignoreCase = true)
                val q = query.trim()
                val matchesQuery = q.isBlank() ||
                    deal.title.contains(q, ignoreCase = true) ||
                    deal.storeName.contains(q, ignoreCase = true) ||
                    deal.categoryName.contains(q, ignoreCase = true) ||
                    deal.dealType.contains(q, ignoreCase = true) ||
                    deal.couponCode.contains(q, ignoreCase = true)
                matchesStore && matchesQuery
            }

            return when (sortOption) {
                "Highest Discount" -> filtered.sortedByDescending { it.discountPercent }
                "Lowest Price" -> filtered.sortedBy { it.effectivePrice }
                "Free Deals" -> filtered.sortedWith(compareByDescending<DealModel> { it.isFreeDeal }.thenBy { it.effectivePrice })
                "Expiring Soon" -> filtered.sortedBy { it.expiryDate }
                else -> filtered.sortedByDescending { it.createdAt }
            }
        }
    }
}

