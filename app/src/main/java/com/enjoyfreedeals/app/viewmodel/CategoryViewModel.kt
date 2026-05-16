package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.CategoryModel
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.repository.CategoryRepository
import com.enjoyfreedeals.app.data.repository.DealRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CategoryUiState(
    val categories: List<CategoryModel> = emptyList(),
    val selectedCategory: CategoryModel? = null,
    val categoryDeals: List<DealModel> = emptyList(),
    val query: String = "",
    val sortOption: String = "Newest Deals",
    val isLoading: Boolean = true
)

class CategoryViewModel(application: Application) : AndroidViewModel(application) {
    private val categoryRepository = CategoryRepository(application.applicationContext)
    private val dealRepository = DealRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(CategoryUiState())
    val uiState: StateFlow<CategoryUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            categoryRepository.getAllCategories().collect { categories ->
                _uiState.update { it.copy(categories = categories, isLoading = false) }
            }
        }
    }

    fun selectCategory(category: CategoryModel) {
        _uiState.update { it.copy(selectedCategory = category, isLoading = true, query = "") }
        viewModelScope.launch {
            dealRepository.getDealsByCategory(category.categoryId).collect { deals ->
                _uiState.update {
                    it.copy(
                        categoryDeals = DealRepository.filterAndSortDeals(deals, it.query, "All", it.sortOption),
                        isLoading = false
                    )
                }
            }
        }
    }

    fun updateCategorySearch(query: String) {
        val selected = _uiState.value.selectedCategory ?: return
        _uiState.update { it.copy(query = query) }
        selectCategory(selected)
    }

    fun updateSort(sort: String) {
        _uiState.update {
            it.copy(
                sortOption = sort,
                categoryDeals = DealRepository.filterAndSortDeals(it.categoryDeals, it.query, "All", sort)
            )
        }
    }
}

