package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PriceAlertModel
import com.enjoyfreedeals.app.data.model.RecentlyViewedDealModel
import com.enjoyfreedeals.app.data.model.SavedDealModel
import com.enjoyfreedeals.app.data.model.SharedDealModel
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.data.repository.PriceAlertRepository
import com.enjoyfreedeals.app.data.repository.RecentlyViewedRepository
import com.enjoyfreedeals.app.data.repository.SavedDealsRepository
import com.enjoyfreedeals.app.data.repository.SharedDealsRepository
import com.enjoyfreedeals.app.data.repository.UserRepository
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val user: UserModel = UserRepository.mockUser,
    val savedDeals: List<SavedDealModel> = emptyList(),
    val sharedDeals: List<SharedDealModel> = emptyList(),
    val priceAlerts: List<PriceAlertModel> = emptyList(),
    val recentlyViewedDeals: List<RecentlyViewedDealModel> = emptyList(),
    val savedDealsCount: Int = 0,
    val sharedDealsCount: Int = 0,
    val priceAlertsCount: Int = 0,
    val recentlyViewedCount: Int = 0,
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val message: String? = null
)

class ProfileViewModel(application: Application) : AndroidViewModel(application) {
    private val userRepository = UserRepository(application.applicationContext)
    private val savedDealsRepository = SavedDealsRepository(application.applicationContext)
    private val sharedDealsRepository = SharedDealsRepository(application.applicationContext)
    private val priceAlertRepository = PriceAlertRepository(application.applicationContext)
    private val recentlyViewedRepository = RecentlyViewedRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()
    private var lastProfileUserId: String = TEST_USER_ID

    init {
        viewModelScope.launch {
            userRepository.getCurrentUserProfile().collect { user ->
                _uiState.update { it.copy(user = user) }
                loadProfileCounts(profileFeatureUserId(user))
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
            savedDealsRepository.removeSavedDeal(lastProfileUserId, deal.dealId)
                .onSuccess {
                    _uiState.update {
                        val updated = it.savedDeals.filterNot { saved -> saved.dealId == deal.dealId }
                        it.copy(savedDeals = updated, savedDealsCount = updated.size, message = "Saved deal removed.")
                    }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(errorMessage = error.friendlyMessage("Could not remove saved deal.")) }
                }
        }
    }

    fun clearSavedDeals() {
        viewModelScope.launch {
            _uiState.value.savedDeals.forEach { deal ->
                savedDealsRepository.removeSavedDeal(lastProfileUserId, deal.dealId)
            }
            _uiState.update { it.copy(savedDeals = emptyList(), savedDealsCount = 0, message = "Saved deals cleared.") }
        }
    }

    fun removePriceAlert(deal: PriceAlertModel) {
        viewModelScope.launch {
            priceAlertRepository.removePriceAlert(lastProfileUserId, deal.dealId)
            _uiState.update {
                val updated = it.priceAlerts.filterNot { alert -> alert.dealId == deal.dealId }
                it.copy(priceAlerts = updated, priceAlertsCount = updated.size, message = "Price alert removed.")
            }
        }
    }

    fun updatePriceAlert(deal: PriceAlertModel, targetPrice: Double) {
        viewModelScope.launch {
            priceAlertRepository.updatePriceAlert(lastProfileUserId, deal.dealId, targetPrice)
            refreshProfileCounts()
        }
    }

    fun clearRecentlyViewed() {
        viewModelScope.launch {
            recentlyViewedRepository.clearRecentlyViewed(lastProfileUserId)
            _uiState.update {
                it.copy(recentlyViewedDeals = emptyList(), recentlyViewedCount = 0, message = "Recently viewed deals cleared.")
            }
        }
    }

    fun loadProfileCounts(userId: String) {
        val safeUserId = userId.ifBlank { TEST_USER_ID }
        lastProfileUserId = safeUserId
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching {
                val savedDeals = savedDealsRepository.getSavedDeals(safeUserId).getOrThrow()
                val savedDealsCount = savedDealsRepository.getSavedDealsCount(safeUserId).getOrElse { error ->
                    android.util.Log.e("SavedDeals", "Failed saved deals count with userId=$safeUserId", error)
                    0
                }
                val sharedDeals = sharedDealsRepository.getSharedDeals(safeUserId)
                val priceAlerts = priceAlertRepository.getPriceAlerts(safeUserId)
                val recentlyViewed = recentlyViewedRepository.getRecentlyViewed(safeUserId)
                ProfileTables(
                    savedDeals = savedDeals,
                    savedDealsCount = savedDealsCount,
                    sharedDeals = sharedDeals,
                    priceAlerts = priceAlerts,
                    recentlyViewed = recentlyViewed
                )
            }.onSuccess { tables ->
                _uiState.update {
                    it.copy(
                        savedDeals = tables.savedDeals,
                        sharedDeals = tables.sharedDeals,
                        priceAlerts = tables.priceAlerts,
                        recentlyViewedDeals = tables.recentlyViewed,
                        savedDealsCount = tables.savedDealsCount,
                        sharedDealsCount = tables.sharedDeals.size,
                        priceAlertsCount = tables.priceAlerts.size,
                        recentlyViewedCount = tables.recentlyViewed.size,
                        isLoading = false,
                        errorMessage = null
                    )
                }
            }.onFailure { error ->
                _uiState.update {
                    it.copy(
                        savedDeals = emptyList(),
                        sharedDeals = emptyList(),
                        priceAlerts = emptyList(),
                        recentlyViewedDeals = emptyList(),
                        savedDealsCount = 0,
                        sharedDealsCount = 0,
                        priceAlertsCount = 0,
                        recentlyViewedCount = 0,
                        isLoading = false,
                        errorMessage = error.friendlyMessage("Could not load profile deal details.")
                    )
                }
            }
        }
    }

    fun refreshProfileCounts() {
        loadProfileCounts(lastProfileUserId)
    }

    private fun profileFeatureUserId(user: UserModel): String =
        user.mobile.ifBlank { userRepository.getMobileUserIdForDealActions() }.ifBlank { TEST_USER_ID }

    private data class ProfileTables(
        val savedDeals: List<SavedDealModel>,
        val savedDealsCount: Int,
        val sharedDeals: List<SharedDealModel>,
        val priceAlerts: List<PriceAlertModel>,
        val recentlyViewed: List<RecentlyViewedDealModel>
    )

    companion object {
        const val TEST_USER_ID = "9699353648"
    }
}
