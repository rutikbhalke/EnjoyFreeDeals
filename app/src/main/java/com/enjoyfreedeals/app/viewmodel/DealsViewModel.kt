package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.local.LocalSampleData
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.data.repository.UserRepository
import com.enjoyfreedeals.app.utils.Constants
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.catch
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
    val errorMessage: String? = null,
    val canLoadMore: Boolean = false,
    val isLoadingMore: Boolean = false,
    val nextPage: Int = 1,
    val message: String? = null
)

class DealsViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = DealRepository(application.applicationContext)
    private val userRepository = UserRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(DealsUiState())
    val uiState: StateFlow<DealsUiState> = _uiState.asStateFlow()
    private val observedPriceHistoryDealIds = mutableSetOf<String>()
    private val pageSize = DealRepository.DEFAULT_PAGE_SIZE
    private val priceHistoryPreloadLimit = 6

    init {
        loadDeals()
        loadSavedDealState()
        loadPriceDropAlertState()
    }

    fun loadDeals() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, nextPage = 1) }
            repository.getAllActiveDeals(page = 1, limit = pageSize)
                .catch { error ->
                    _uiState.update {
                        val fallbackDeals = LocalSampleData.deals
                        it.copy(
                            isLoading = false,
                            allDeals = fallbackDeals,
                            filteredDeals = DealRepository.filterAndSortDeals(
                                fallbackDeals,
                                it.query,
                                it.storeFilter,
                                it.sortOption
                            ),
                            canLoadMore = false,
                            errorMessage = if (fallbackDeals.isEmpty()) {
                                error.friendlyMessage("Could not load live deals. Please check the backend connection.")
                            } else {
                                null
                            }
                        )
                    }
                    observePriceHistory(LocalSampleData.deals.take(priceHistoryPreloadLimit))
                }
                .collect { deals ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            allDeals = deals,
                            filteredDeals = DealRepository.filterAndSortDeals(deals, it.query, it.storeFilter, it.sortOption),
                            canLoadMore = deals.size >= pageSize,
                            nextPage = 2,
                            errorMessage = null
                        )
                    }
                    observePriceHistory(deals.take(priceHistoryPreloadLimit))
                }
        }
    }

    fun loadMoreDeals() {
        val state = _uiState.value
        if (state.isLoading || state.isLoadingMore || !state.canLoadMore) return

        viewModelScope.launch {
            val page = state.nextPage
            _uiState.update { it.copy(isLoadingMore = true, message = null) }
            repository.getAllActiveDeals(page = page, limit = pageSize)
                .catch { _ ->
                    _uiState.update {
                        it.copy(
                            isLoadingMore = false,
                            message = null
                        )
                    }
                }
                .collect { nextDeals ->
                    _uiState.update {
                        val merged = (it.allDeals + nextDeals).distinctBy { deal -> deal.dealId }
                        it.copy(
                            allDeals = merged,
                            filteredDeals = DealRepository.filterAndSortDeals(merged, it.query, it.storeFilter, it.sortOption),
                            canLoadMore = nextDeals.size >= pageSize,
                            isLoadingMore = false,
                            nextPage = page + 1
                        )
                    }
                    observePriceHistory(nextDeals.take(priceHistoryPreloadLimit))
                }
        }
    }

    private fun loadSavedDealState() {
        viewModelScope.launch {
            repository.getSavedDeals()
                .catch { }
                .collect { saved ->
                    _uiState.update { it.copy(savedDeals = saved.map { deal -> deal.dealId }.toSet()) }
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
        viewModelScope.launch {
            repository.getPriceAlertDeals()
                .catch { }
                .collect { alerts ->
                    _uiState.update {
                        it.copy(priceDropAlerts = it.priceDropAlerts + alerts.map { deal -> deal.dealId })
                    }
                }
        }
    }

    private fun observePriceHistory(deals: List<DealModel>) {
        deals.forEach { deal ->
            if (!observedPriceHistoryDealIds.add(deal.dealId)) return@forEach
            viewModelScope.launch {
                repository.getPriceHistory(deal.dealId)
                    .catch { _ ->
                        _uiState.update { state ->
                            state.copy(
                                priceHistory = state.priceHistory + (
                                    deal.dealId to listOf(DealRepository.buildPriceHistoryRecord(deal))
                                )
                            )
                        }
                    }
                    .collect { history ->
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
            runCatching { repository.shareDeal(deal.dealId) }
                .onSuccess { _uiState.update { it.copy(message = "Deal shared.") } }
                .onFailure { error -> _uiState.update { it.copy(message = error.friendlyMessage("Could not save shared deal.")) } }
        }
    }

    fun selectDeal(deal: DealModel) {
        _uiState.update { it.copy(selectedDeal = deal) }
        observePriceHistory(listOf(deal))
        viewModelScope.launch {
            runCatching { repository.recordRecentlyViewed(deal.dealId) }
        }
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
