package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.BlogModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import com.enjoyfreedeals.app.data.remote.dataArray
import com.enjoyfreedeals.app.data.remote.toBlogModel
import com.enjoyfreedeals.app.data.remote.toJsonObjects
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class BlogRepository(private val context: Context) {
    private val backendClient = BackendClient()

    fun getPublishedBlogs(): Flow<List<BlogModel>> = flow {
        emit(loadBlogs().getOrThrow())
    }

    private suspend fun loadBlogs(): Result<List<BlogModel>> = runCatching {
        backendClient.get("/api/blogs", AuthSessionStore.accessToken(context))
            .dataArray()
            .toJsonObjects()
            .map { it.toBlogModel() }
    }
}
