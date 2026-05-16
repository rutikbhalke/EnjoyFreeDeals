package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.mock.MockBlogs
import com.enjoyfreedeals.app.data.model.BlogModel
import com.enjoyfreedeals.app.utils.Constants
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOf

class BlogRepository(private val context: Context) {
    private val firebaseEnabled: Boolean
        get() = FirebaseApp.getApps(context).isNotEmpty()

    private val firestore: FirebaseFirestore?
        get() = if (firebaseEnabled) FirebaseFirestore.getInstance() else null

    fun getPublishedBlogs(): Flow<List<BlogModel>> {
        val db = firestore ?: return flowOf(MockBlogs.blogs)
        return callbackFlow {
            val listener = db.collection(Constants.BLOGS)
                .whereEqualTo("isPublished", true)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        trySend(MockBlogs.blogs)
                        return@addSnapshotListener
                    }
                    val blogs = snapshot?.documents?.mapNotNull { it.toObject(BlogModel::class.java) }.orEmpty()
                    trySend(blogs.ifEmpty { MockBlogs.blogs })
                }
            awaitClose { listener.remove() }
        }
    }

    fun getBlogById(blogId: String): Flow<BlogModel?> =
        flowOf(MockBlogs.blogs.firstOrNull { it.blogId == blogId })
}

