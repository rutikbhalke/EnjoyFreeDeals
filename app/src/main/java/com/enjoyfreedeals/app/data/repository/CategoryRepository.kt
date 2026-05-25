package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.CategoryModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import com.enjoyfreedeals.app.data.remote.dataArray
import com.enjoyfreedeals.app.data.remote.toCategoryModel
import com.enjoyfreedeals.app.data.remote.toJsonObjects
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class CategoryRepository(private val context: Context) {
    private val backendClient = BackendClient()

    fun getAllCategories(): Flow<List<CategoryModel>> = flow {
        emit(loadCategories().getOrThrow())
    }

    private suspend fun loadCategories(): Result<List<CategoryModel>> = runCatching {
        backendClient.get("/api/categories", AuthSessionStore.accessToken(context))
            .dataArray()
            .toJsonObjects()
            .map { it.toCategoryModel() }
    }
}
