package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.SavedDealModel
import com.enjoyfreedeals.app.data.repository.SavedDealsRepository
import com.enjoyfreedeals.app.data.repository.UserRepository
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SavedDealsUiState(
    val isLoading: Boolean = false,
    val savedDeals: List<SavedDealModel> = emptyList(),
    val errorMessage: String? = null
)

class SavedDealsViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = SavedDealsRepository(application.applicationContext)
    private val userRepository = UserRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(SavedDealsUiState())
    val uiState: StateFlow<SavedDealsUiState> = _uiState.asStateFlow()

    fun loadSavedDeals(userId: String = userRepository.getMobileUserIdForDealActions()) {
        val safeUserId = userId.ifBlank { UserRepository.TEST_MOBILE_USER_ID }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            repository.getSavedDeals(safeUserId)
                .onSuccess { deals ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            savedDeals = deals,
                            errorMessage = null
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            savedDeals = emptyList(),
                            errorMessage = error.friendlyMessage("Could not load saved deals.")
                        )
                    }
                }
        }
    }

    fun removeSavedDeal(userId: String, dealId: String, onRemoved: () -> Unit = {}) {
        val safeUserId = userId.ifBlank { UserRepository.TEST_MOBILE_USER_ID }
        viewModelScope.launch {
            repository.removeSavedDeal(safeUserId, dealId)
                .onSuccess {
                    _uiState.update { state ->
                        state.copy(savedDeals = state.savedDeals.filterNot { it.dealId == dealId })
                    }
                    onRemoved()
                    refresh(safeUserId)
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(errorMessage = error.friendlyMessage("Could not remove saved deal."))
                    }
                }
        }
    }

    fun refresh(userId: String = userRepository.getMobileUserIdForDealActions()) {
        loadSavedDeals(userId)
    }
}
