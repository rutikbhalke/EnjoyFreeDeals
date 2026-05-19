package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.mock.MockDeals
import com.enjoyfreedeals.app.data.model.PriceComparisonProductModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf

class PriceComparisonRepository(@Suppress("unused") private val context: Context) {
    fun getPriceComparisons(): Flow<List<PriceComparisonProductModel>> =
        flowOf(MockDeals.priceComparisonProducts)

    fun getComparisonForProduct(productId: String): PriceComparisonProductModel? =
        MockDeals.priceComparisonProducts.firstOrNull { it.productId == productId }
}
