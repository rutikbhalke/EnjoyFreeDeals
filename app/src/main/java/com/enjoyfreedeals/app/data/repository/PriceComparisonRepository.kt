package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.PriceComparisonProductModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import com.enjoyfreedeals.app.data.remote.dataArray
import com.enjoyfreedeals.app.data.remote.dataObject
import com.enjoyfreedeals.app.data.remote.toJsonObjects
import com.enjoyfreedeals.app.data.remote.toPriceComparisonProductModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.net.URLEncoder

class PriceComparisonRepository(private val context: Context) {
    private val backendClient = BackendClient()

    fun getPriceComparisons(): Flow<List<PriceComparisonProductModel>> = flow {
        emit(loadComparisons().getOrThrow())
    }

    suspend fun getComparisonForProduct(productId: String): PriceComparisonProductModel? =
        backendClient.get("/api/price-comparisons/${productId.urlEncode()}", AuthSessionStore.accessToken(context))
            .dataObject()
            .toPriceComparisonProductModel()

    private suspend fun loadComparisons(): Result<List<PriceComparisonProductModel>> = runCatching {
        backendClient.get("/api/price-comparisons", AuthSessionStore.accessToken(context))
            .dataArray()
            .toJsonObjects()
            .map { it.toPriceComparisonProductModel() }
    }

    private fun String.urlEncode(): String =
        URLEncoder.encode(this, Charsets.UTF_8.name())
}
