package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.data.repository.UserRepository
import com.enjoyfreedeals.app.utils.Constants
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DealsUiState(
    val isLoading: Boolean = true,
    val allDeals: List<DealModel> = emptyList(),
    val filteredDeals: List<DealModel> = emptyList(),
    val savedDeals: Set<String> = emptySet(),
    val query: String = "",
    val storeFilter: String = "All",
    val sortOption: String = "Newest Deals",
    val priceHistory: Map<String, List<PricePointModel>> = emptyMap(),
    val priceDropAlerts: Set<String> = emptySet(),
    val priceDropTargets: Map<String, Double> = emptyMap(),
    val selectedDeal: DealModel? = null,
    val message: String? = null
)

class DealsViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = DealRepository(application.applicationContext)
    private val userRepository = UserRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(DealsUiState())
    val uiState: StateFlow<DealsUiState> = _uiState.asStateFlow()
    private val observedPriceHistoryDealIds = mutableSetOf<String>()

    init {
        loadDeals()
        loadPriceDropAlertState()
    }

    fun loadDeals() {
        viewModelScope.launch {
            repository.getAllActiveDeals().collect { deals ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        allDeals = deals,
                        filteredDeals = DealRepository.filterAndSortDeals(deals, it.query, it.storeFilter, it.sortOption)
                    )
                }
                observePriceHistory(deals)
                deals.forEach { deal ->
                    launch {
                        runCatching { repository.trackLivePriceIfChanged(deal) }
                    }
                }
            }
        }
    }

    private fun loadPriceDropAlertState() {
        viewModelScope.launch {
            userRepository.getCurrentUserProfile().collect { user ->
                _uiState.update {
                    it.copy(
                        priceDropAlerts = user.priceDropAlerts.toSet(),
                        priceDropTargets = user.priceDropTargetPrices
                    )
                }
            }
        }
    }

    private fun observePriceHistory(deals: List<DealModel>) {
        deals.forEach { deal ->
            if (!observedPriceHistoryDealIds.add(deal.dealId)) return@forEach
            viewModelScope.launch {
                repository.getPriceHistory(deal.dealId).collect { history ->
                    _uiState.update { state ->
                        state.copy(priceHistory = state.priceHistory + (deal.dealId to history))
                    }
                }
            }
        }
    }

    fun updateSearch(query: String) {
        _uiState.update {
            it.copy(
                query = query,
                filteredDeals = DealRepository.filterAndSortDeals(it.allDeals, query, it.storeFilter, it.sortOption)
            )
        }
    }

    fun updateStoreFilter(store: String) {
        val safeStore = if (Constants.storeFilters.contains(store)) store else "All"
        _uiState.update {
            it.copy(
                storeFilter = safeStore,
                filteredDeals = DealRepository.filterAndSortDeals(it.allDeals, it.query, safeStore, it.sortOption)
            )
        }
    }

    fun updateSort(sort: String) {
        val safeSort = if (Constants.sortOptions.contains(sort)) sort else "Newest Deals"
        _uiState.update {
            it.copy(
                sortOption = safeSort,
                filteredDeals = DealRepository.filterAndSortDeals(it.allDeals, it.query, it.storeFilter, safeSort)
            )
        }
    }

    fun saveDeal(deal: DealModel) {
        viewModelScope.launch {
            runCatching { repository.saveDeal(deal.dealId) }
                .onSuccess {
                    _uiState.update { state ->
                        state.copy(savedDeals = state.savedDeals + deal.dealId, message = "Deal saved.")
                    }
                }
                .onFailure { error -> _uiState.update { it.copy(message = error.friendlyMessage()) } }
        }
    }

    fun removeSavedDeal(deal: DealModel) {
        viewModelScope.launch {
            repository.removeSavedDeal(deal.dealId)
            _uiState.update { it.copy(savedDeals = it.savedDeals - deal.dealId, message = "Saved deal removed.") }
        }
    }

    fun shareDeal(deal: DealModel) {
        viewModelScope.launch {
            repository.shareDeal(deal.dealId)
            _uiState.update { it.copy(message = "Deal shared.") }
        }
    }

    fun selectDeal(deal: DealModel) {
        _uiState.update { it.copy(selectedDeal = deal) }
        observePriceHistory(listOf(deal))
    }

    fun togglePriceDropAlert(deal: DealModel) {
        viewModelScope.launch {
            val enabled = _uiState.value.priceDropAlerts.contains(deal.dealId)
            if (enabled) {
                removePriceAlert(deal)
            } else {
                val history = _uiState.value.priceHistory[deal.dealId].orEmpty()
                savePriceAlert(deal, DealRepository.suggestedAlertPrice(deal, history))
            }
        }
    }

    fun savePriceAlert(deal: DealModel, targetPrice: Double) {
        viewModelScope.launch {
            val safeTarget = targetPrice.coerceAtLeast(0.0)
            val history = _uiState.value.priceHistory[deal.dealId].orEmpty()
            repository.enablePriceDropAlert(deal, safeTarget)
            repository.createPriceDropNotificationIfNeeded(deal, history, safeTarget)
            _uiState.update {
                it.copy(
                    priceDropAlerts = it.priceDropAlerts + deal.dealId,
                    priceDropTargets = it.priceDropTargets + (deal.dealId to safeTarget),
                    message = "Price alert saved at Rs.${safeTarget.toInt()}."
                )
            }
        }
    }

    fun removePriceAlert(deal: DealModel) {
        viewModelScope.launch {
            repository.disablePriceDropAlert(deal.dealId)
            _uiState.update {
                it.copy(
                    priceDropAlerts = it.priceDropAlerts - deal.dealId,
                    priceDropTargets = it.priceDropTargets - deal.dealId,
                    message = "Price alert removed."
                )
            }
        }
    }

    fun clearMessage() {
        _uiState.update { it.copy(message = null) }
    }
}
