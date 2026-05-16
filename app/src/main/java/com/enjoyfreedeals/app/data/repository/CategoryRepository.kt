package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.mock.MockCategories
import com.enjoyfreedeals.app.data.model.CategoryModel
import com.enjoyfreedeals.app.utils.Constants
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.tasks.await

class CategoryRepository(private val context: Context) {
    private val firebaseEnabled: Boolean
        get() = FirebaseApp.getApps(context).isNotEmpty()

    private val firestore: FirebaseFirestore?
        get() = if (firebaseEnabled) FirebaseFirestore.getInstance() else null

    fun getAllCategories(): Flow<List<CategoryModel>> {
        val db = firestore ?: return flowOf(MockCategories.categories)
        return callbackFlow {
            val listener = db.collection(Constants.CATEGORIES)
                .whereEqualTo("isActive", true)
                .orderBy("categoryName", Query.Direction.ASCENDING)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        trySend(MockCategories.categories)
                        return@addSnapshotListener
                    }
                    val categories = snapshot?.documents?.mapNotNull { it.toObject(CategoryModel::class.java) }.orEmpty()
                    trySend(categories.ifEmpty { MockCategories.categories })
                }
            awaitClose { listener.remove() }
        }
    }

    suspend fun getCategoryById(categoryId: String): CategoryModel? {
        val db = firestore ?: return MockCategories.categories.firstOrNull { it.categoryId == categoryId }
        return db.collection(Constants.CATEGORIES).document(categoryId).get().await().toObject(CategoryModel::class.java)
    }

    suspend fun updateCategoryDealCount(categoryId: String, dealCount: Int) {
        if (firebaseEnabled) {
            firestore?.collection(Constants.CATEGORIES)?.document(categoryId)
                ?.update("dealCount", dealCount)
                ?.await()
        }
    }
}

