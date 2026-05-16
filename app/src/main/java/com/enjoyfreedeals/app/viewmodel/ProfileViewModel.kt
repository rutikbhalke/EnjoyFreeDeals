package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.data.repository.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val user: UserModel = UserRepository.mockUser,
    val savedDeals: List<DealModel> = emptyList(),
    val sharedDeals: List<DealModel> = emptyList(),
    val message: String? = null
)

class ProfileViewModel(application: Application) : AndroidViewModel(application) {
    private val userRepository = UserRepository(application.applicationContext)
    private val dealRepository = DealRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            userRepository.getCurrentUserProfile().collect { user ->
                _uiState.update { it.copy(user = user) }
            }
        }
        viewModelScope.launch {
            dealRepository.getSavedDeals().collect { saved ->
                _uiState.update { it.copy(savedDeals = saved) }
            }
        }
        viewModelScope.launch {
            dealRepository.getSharedDeals().collect { shared ->
                _uiState.update { it.copy(sharedDeals = shared) }
            }
        }
    }

    fun updateNotificationPreference(enabled: Boolean) {
        viewModelScope.launch {
            userRepository.updateNotificationPreference(enabled)
            _uiState.update { it.copy(user = it.user.copy(notificationEnabled = enabled)) }
        }
    }

    fun updateDarkModePreference(enabled: Boolean) {
        viewModelScope.launch {
            userRepository.updateDarkModePreference(enabled)
            _uiState.update { it.copy(user = it.user.copy(darkModeEnabled = enabled)) }
        }
    }

    fun removeSavedDeal(deal: DealModel) {
        viewModelScope.launch {
            dealRepository.removeSavedDeal(deal.dealId)
            _uiState.update { it.copy(savedDeals = it.savedDeals.filterNot { saved -> saved.dealId == deal.dealId }) }
        }
    }
}

