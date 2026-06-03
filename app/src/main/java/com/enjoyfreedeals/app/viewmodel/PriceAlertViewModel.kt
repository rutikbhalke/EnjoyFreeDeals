@file:Suppress("unused")

package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.supabase.PriceAlertDto
import com.enjoyfreedeals.app.data.repository.PriceAlertRepository
import com.enjoyfreedeals.app.data.repository.UserRepository
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PriceAlertUiState(
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val alerts: List<PriceAlertDto> = emptyList(),
    val message: String? = null
)

class PriceAlertViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = PriceAlertRepository(application.applicationContext)
    private val userRepository = UserRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(PriceAlertUiState())
    val uiState: StateFlow<PriceAlertUiState> = _uiState.asStateFlow()

    fun refresh() {
        viewModelScope.launch {
            val userId = userRepository.getCurrentUserId()
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching { repository.getUserPriceAlerts(userId) }
                .onSuccess { alerts -> _uiState.update { it.copy(isLoading = false, alerts = alerts) } }
                .onFailure { error -> _uiState.update { it.copy(isLoading = false, errorMessage = error.friendlyMessage()) } }
        }
    }

    fun createPriceAlert(productId: String, targetPrice: Double) {
        viewModelScope.launch {
            val userId = userRepository.getCurrentUserId()
            runCatching { repository.createPriceAlert(userId, productId, targetPrice) }
                .onSuccess {
                    _uiState.update { it.copy(message = "Price alert saved.") }
                    refresh()
                }
                .onFailure { error -> _uiState.update { it.copy(errorMessage = error.friendlyMessage()) } }
        }
    }
}
