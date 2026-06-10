package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.PriceComparisonModel
import com.enjoyfreedeals.app.data.repository.PriceComparisonRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PriceComparisonUiState(
    val isLoading: Boolean = false,
    val comparisons: List<PriceComparisonModel> = emptyList(),
    val lowestPrice: Double? = null,
    val bestPlatform: String? = null,
    val errorMessage: String? = null
)

class PriceComparisonViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = PriceComparisonRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(PriceComparisonUiState())
    val uiState: StateFlow<PriceComparisonUiState> = _uiState.asStateFlow()

    fun loadPriceComparison(productId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getPriceComparisonResult(productId)
                .onSuccess { rows ->
                    val lowest = rows.filter { it.isAvailable }.minByOrNull { it.price }
                    _uiState.value = PriceComparisonUiState(
                        comparisons = rows,
                        lowestPrice = lowest?.price,
                        bestPlatform = lowest?.platform
                    )
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = error.message ?: "Price comparison unavailable")
                    }
                }
        }
    }
}
