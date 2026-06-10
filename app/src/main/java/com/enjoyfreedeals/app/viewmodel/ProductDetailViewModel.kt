@file:Suppress("unused")

package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.model.PriceStatsModel
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.data.repository.ProductRepository
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProductDetailUiState(
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val deal: DealModel? = null,
    val comparison: List<StorePriceModel> = emptyList(),
    val priceHistory: List<PricePointModel> = emptyList(),
    val priceStats: PriceStatsModel? = null
)

class ProductDetailViewModel(application: Application) : AndroidViewModel(application) {
    private val dealRepository = DealRepository(application.applicationContext)
    private val productRepository = ProductRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(ProductDetailUiState())
    val uiState: StateFlow<ProductDetailUiState> = _uiState.asStateFlow()

    fun load(offerId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching {
                val deal = dealRepository.getDealByOfferId(offerId)
                val productId = deal?.productId?.ifBlank { offerId } ?: offerId
                val comparison = productRepository.getPriceComparison(productId)
                val history = productRepository.getPriceHistory(productId)
                val stats = productRepository.getPriceStatsModel(productId, deal?.effectivePrice ?: 0.0)
                ProductDetailUiState(
                    isLoading = false,
                    deal = deal?.copy(
                        comparisonPrices = comparison.ifEmpty { deal.comparisonPrices },
                        lowestPrice = comparison.filter { it.available }.minOfOrNull { it.price } ?: deal.lowestPrice,
                        bestPlatform = comparison.filter { it.available }.minByOrNull { it.price }?.platform ?: deal.bestPlatform,
                        comparisonCount = comparison.ifEmpty { deal.comparisonPrices }.size,
                        lastPriceCheckedAt = comparison.maxOfOrNull { it.lastUpdated } ?: deal.lastPriceCheckedAt
                    ),
                    comparison = comparison,
                    priceHistory = history,
                    priceStats = stats
                )
            }.onSuccess { loaded ->
                _uiState.value = loaded
            }.onFailure { error ->
                _uiState.update { it.copy(isLoading = false, errorMessage = error.friendlyMessage()) }
            }
        }
    }

    fun refresh() {
        _uiState.value.deal?.dealId?.let(::load)
    }
}
