package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.local.LocalSampleData
import com.enjoyfreedeals.app.data.mock.MockCategories
import com.enjoyfreedeals.app.data.model.CategoryModel
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PriceComparisonProductModel
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.data.repository.CategoryRepository
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.data.repository.NotificationRepository
import com.enjoyfreedeals.app.data.repository.PriceComparisonRepository
import com.enjoyfreedeals.app.data.repository.UserRepository
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = true,
    val user: UserModel = UserRepository.mockUser,
    val query: String = "",
    val deals: List<DealModel> = emptyList(),
    val priceComparisons: List<PriceComparisonProductModel> = emptyList(),
    val categories: List<CategoryModel> = emptyList(),
    val unreadCount: Int = 0,
    val errorMessage: String? = null
)

class HomeViewModel(application: Application) : AndroidViewModel(application) {
    private val dealRepository = DealRepository(application.applicationContext)
    private val categoryRepository = CategoryRepository(application.applicationContext)
    private val notificationRepository = NotificationRepository(application.applicationContext)
    private val priceComparisonRepository = PriceComparisonRepository(application.applicationContext)
    private val userRepository = UserRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            dealRepository.getAllActiveDeals(limit = 30)
                .catch { error ->
                    val fallbackDeals = LocalSampleData.deals
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            deals = fallbackDeals,
                            errorMessage = if (fallbackDeals.isEmpty()) {
                                error.friendlyMessage("Could not load live deals. Please check the backend connection.")
                            } else {
                                null
                            }
                        )
                    }
                }
                .collect { deals ->
                    _uiState.update { it.copy(isLoading = false, deals = deals, errorMessage = null) }
                }
        }
        viewModelScope.launch {
            categoryRepository.getAllCategories()
                .catch { _ ->
                    _uiState.update {
                        it.copy(categories = MockCategories.categories)
                    }
                }
                .collect { categories ->
                    _uiState.update { it.copy(categories = categories) }
                }
        }
        viewModelScope.launch {
            priceComparisonRepository.getPriceComparisons()
                .catch { _ -> _uiState.update { it.copy(priceComparisons = LocalSampleData.priceComparisonProducts) } }
                .collect { comparisons ->
                    _uiState.update { it.copy(priceComparisons = comparisons) }
                }
        }
        viewModelScope.launch {
            userRepository.getCurrentUserProfile().collect { user ->
                _uiState.update { it.copy(user = user) }
            }
        }
        viewModelScope.launch {
            val userId = userRepository.getCurrentUserId()
            notificationRepository.getUnreadNotificationCount(userId)
                .catch { _ -> _uiState.update { it.copy(unreadCount = 0) } }
                .collect { count ->
                    _uiState.update { it.copy(unreadCount = count) }
                }
        }
    }

    fun updateQuery(query: String) {
        _uiState.update { it.copy(query = query) }
    }
}
