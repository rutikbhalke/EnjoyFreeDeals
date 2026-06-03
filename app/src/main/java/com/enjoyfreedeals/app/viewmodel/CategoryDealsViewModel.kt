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

data class CategoryDealsUiState(
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val categorySlug: String = "",
    val deals: List<DealModel> = emptyList(),
    val sortOption: String = "Newest Deals"
)

class CategoryDealsViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = DealRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(CategoryDealsUiState())
    val uiState: StateFlow<CategoryDealsUiState> = _uiState.asStateFlow()

    fun load(categorySlug: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, categorySlug = categorySlug, errorMessage = null) }
            repository.getDealsByCategory(categorySlug)
                .catch { error ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = error.friendlyMessage()) }
                }
                .collect { deals ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            deals = DealRepository.filterAndSortDeals(deals, "", "All", it.sortOption)
                        )
                    }
                }
        }
    }

    fun refresh() {
        _uiState.value.categorySlug.takeIf { it.isNotBlank() }?.let(::load)
    }
}
