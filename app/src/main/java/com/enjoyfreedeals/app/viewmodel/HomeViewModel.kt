package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.CategoryModel
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.data.repository.CategoryRepository
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.data.repository.NotificationRepository
import com.enjoyfreedeals.app.data.repository.UserRepository
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
    val categories: List<CategoryModel> = emptyList(),
    val unreadCount: Int = 0,
    val errorMessage: String? = null
)

class HomeViewModel(application: Application) : AndroidViewModel(application) {
    private val dealRepository = DealRepository(application.applicationContext)
    private val categoryRepository = CategoryRepository(application.applicationContext)
    private val notificationRepository = NotificationRepository(application.applicationContext)
    private val userRepository = UserRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            dealRepository.getAllActiveDeals().collect { deals ->
                _uiState.update { it.copy(isLoading = false, deals = deals) }
            }
        }
        viewModelScope.launch {
            categoryRepository.getAllCategories().collect { categories ->
                _uiState.update { it.copy(categories = categories) }
            }
        }
        viewModelScope.launch {
            userRepository.getCurrentUserProfile().collect { user ->
                _uiState.update { it.copy(user = user) }
            }
        }
        viewModelScope.launch {
            val userId = userRepository.getCurrentUserId().orEmpty()
            notificationRepository.getUnreadNotificationCount(userId).collect { count ->
                _uiState.update { it.copy(unreadCount = count) }
            }
        }
    }

    fun updateQuery(query: String) {
        _uiState.update { it.copy(query = query) }
    }
}

