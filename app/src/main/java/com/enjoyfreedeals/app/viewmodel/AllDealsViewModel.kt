@file:Suppress("unused")

package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AllDealsUiState(
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val deals: List<DealModel> = emptyList(),
    val query: String = "",
    val sortOption: String = "Newest Deals"
)

class AllDealsViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = DealRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(AllDealsUiState())
    val uiState: StateFlow<AllDealsUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            repository.getActiveDeals()
                .catch { error ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = error.friendlyMessage()) }
                }
                .collect { deals ->
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            errorMessage = null,
                            deals = DealRepository.filterAndSortDeals(deals, state.query, "All", state.sortOption)
                        )
                    }
                }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching { repository.refreshDeals() }
                .onSuccess { deals ->
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            deals = DealRepository.filterAndSortDeals(deals, state.query, "All", state.sortOption)
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = error.friendlyMessage()) }
                }
        }
    }
}
