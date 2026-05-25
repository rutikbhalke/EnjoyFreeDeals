package com.enjoyfreedeals.app.ui.deals

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.ui.components.DealCard
import com.enjoyfreedeals.app.ui.components.DealSearchBox
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.FilterRow
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.SectionTitle
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.utils.Constants
import com.enjoyfreedeals.app.viewmodel.DealsUiState

@Composable
fun DealsScreen(
    state: DealsUiState,
    onSearch: (String) -> Unit,
    onStoreFilter: (String) -> Unit,
    onSort: (String) -> Unit,
    onViewDeal: (DealModel) -> Unit,
    onSaveDeal: (DealModel) -> Unit,
    onRemoveSavedDeal: (DealModel) -> Unit,
    onShareDeal: (DealModel) -> Unit,
    onTogglePriceAlert: (DealModel) -> Unit,
    onOpenDealDetails: (DealModel) -> Unit,
    onPriceAlertClick: (DealModel) -> Unit,
    onLoadMore: () -> Unit,
    onMessageShown: () -> Unit
) {
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    LaunchedEffect(state.message) {
        if (state.message != null) {
            snackbarHostState.showSnackbar(state.message)
            onMessageShown()
        }
    }

    PremiumBackground {
        LazyColumn(
            contentPadding = PaddingValues(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                SectionTitle("All Deals", subtitle = "Live active deals from the EnjoyFreeDeals backend")
            }
            item {
                DealSearchBox(state.query, onSearch)
            }
            item {
                FilterRow(Constants.storeFilters, state.storeFilter, onStoreFilter)
            }
            item {
                FilterRow(Constants.sortOptions, state.sortOption, onSort)
            }
            if (state.isLoading) {
                item {
                    EmptyState("Loading live deals.", "Fetching fresh offers from the backend.")
                }
            } else if (state.errorMessage != null) {
                item {
                    EmptyState("Live deals unavailable.", state.errorMessage)
                }
            } else if (state.filteredDeals.isEmpty()) {
                item {
                    EmptyState("No deals found.", "Try another keyword.")
                }
            } else {
                items(state.filteredDeals, key = { it.dealId }) { deal ->
                    DealCard(
                        deal = deal,
                        isSaved = state.savedDeals.contains(deal.dealId),
                        onViewDeal = onViewDeal,
                        onSaveDeal = {
                            if (state.savedDeals.contains(it.dealId)) onRemoveSavedDeal(it) else onSaveDeal(it)
                        },
                        onShareDeal = {
                            shareDeal(context, it)
                            onShareDeal(it)
                        },
                        priceHistory = state.priceHistory[deal.dealId].orEmpty(),
                        isPriceAlertEnabled = state.priceDropAlerts.contains(deal.dealId),
                        onTogglePriceAlert = onTogglePriceAlert,
                        onOpenDetails = onOpenDealDetails,
                        onPriceAlertClick = onPriceAlertClick
                    )
                }
                if (state.canLoadMore) {
                    item {
                        Button(
                            onClick = onLoadMore,
                            enabled = !state.isLoadingMore,
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(if (state.isLoadingMore) "Loading..." else "Load More Deals")
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(12.dp)) }
        }
        SnackbarHost(snackbarHostState, Modifier.padding(16.dp))
    }
}

fun shareDeal(context: Context, deal: DealModel) {
    val text = "${deal.title}\n${deal.description}\n${deal.redirectUrl}"
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, deal.title)
        putExtra(Intent.EXTRA_TEXT, text)
    }
    context.startActivity(Intent.createChooser(intent, "Share deal"))
}
