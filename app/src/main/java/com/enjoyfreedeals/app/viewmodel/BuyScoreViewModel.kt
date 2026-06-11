package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.BuyScoreModel
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.repository.BuyScoreRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class BuyScoreRange(val label: String) {
    RIGHT_NOW("Right now"),
    IN_15_DAYS("In 15 days"),
    IN_30_DAYS("In 30 days")
}

data class BuyScoreUiState(
    val isLoading: Boolean = false,
    val buyScoreModel: BuyScoreModel? = null,
    val selectedRange: BuyScoreRange = BuyScoreRange.RIGHT_NOW,
    val selectedScore: Int = 0,
    val errorMessage: String? = null
)

class BuyScoreViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = BuyScoreRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(BuyScoreUiState())
    val uiState: StateFlow<BuyScoreUiState> = _uiState.asStateFlow()

    fun loadBuyScore(deal: DealModel) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val productId = deal.productId.ifBlank { deal.dealId }
            val model = repository.getBuyScore(productId, deal)
            val range = _uiState.value.selectedRange
            _uiState.value = BuyScoreUiState(
                isLoading = false,
                buyScoreModel = model,
                selectedRange = range,
                selectedScore = scoreForRange(model, range)
            )
        }
    }

    fun selectRange(range: BuyScoreRange) {
        _uiState.update { state ->
            val model = state.buyScoreModel
            state.copy(
                selectedRange = range,
                selectedScore = model?.let { scoreForRange(it, range) } ?: state.selectedScore
            )
        }
    }

    private fun scoreForRange(model: BuyScoreModel, range: BuyScoreRange): Int =
        when (range) {
            BuyScoreRange.RIGHT_NOW -> model.currentScore
            BuyScoreRange.IN_15_DAYS -> model.scoreIn15Days
            BuyScoreRange.IN_30_DAYS -> model.scoreIn30Days
        }.coerceIn(0, 100)
}
