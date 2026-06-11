package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.data.repository.UserRepository
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val user: UserModel = UserRepository.mockUser,
    val savedDeals: List<DealModel> = emptyList(),
    val sharedDeals: List<DealModel> = emptyList(),
    val priceAlertDeals: List<DealModel> = emptyList(),
    val recentlyViewedDeals: List<DealModel> = emptyList(),
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
            dealRepository.getSavedDeals()
                .catch { error ->
                    _uiState.update { it.copy(savedDeals = emptyList(), message = error.friendlyMessage("Could not load saved deals.")) }
                }
                .collect { saved ->
                    _uiState.update { it.copy(savedDeals = saved) }
                }
        }
        viewModelScope.launch {
            dealRepository.getSharedDeals()
                .catch { error ->
                    _uiState.update { it.copy(sharedDeals = emptyList(), message = error.friendlyMessage("Could not load shared deals.")) }
                }
                .collect { shared ->
                    _uiState.update { it.copy(sharedDeals = shared) }
                }
        }
        viewModelScope.launch {
            dealRepository.getPriceAlertDeals()
                .catch { error ->
                    _uiState.update { it.copy(priceAlertDeals = emptyList(), message = error.friendlyMessage("Could not load price alerts.")) }
                }
                .collect { alerts ->
                    _uiState.update { it.copy(priceAlertDeals = alerts) }
                }
        }
        viewModelScope.launch {
            dealRepository.getRecentlyViewedDeals()
                .catch { error ->
                    _uiState.update { it.copy(recentlyViewedDeals = emptyList(), message = error.friendlyMessage("Could not load recently viewed deals.")) }
                }
                .collect { viewed ->
                    _uiState.update { it.copy(recentlyViewedDeals = viewed) }
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

    fun clearSavedDeals() {
        viewModelScope.launch {
            _uiState.value.savedDeals.forEach { deal ->
                dealRepository.removeSavedDeal(deal.dealId)
            }
            _uiState.update { it.copy(savedDeals = emptyList(), message = "Saved deals cleared.") }
        }
    }
}
