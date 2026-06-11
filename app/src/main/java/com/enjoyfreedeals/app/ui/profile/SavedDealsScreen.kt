package com.enjoyfreedeals.app.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.ProfileDealCard
import com.enjoyfreedeals.app.ui.components.SectionTitle
import com.enjoyfreedeals.app.viewmodel.SavedDealsUiState

@Composable
fun SavedDealsScreen(
    userId: String,
    state: SavedDealsUiState,
    onLoadSavedDeals: (String) -> Unit,
    onViewDeal: (DealModel) -> Unit,
    onOpenDealDetails: (DealModel) -> Unit,
    onRemoveSavedDeal: (DealModel) -> Unit
) {
    LaunchedEffect(userId) {
        onLoadSavedDeals(userId)
    }

    PremiumBackground {
        LazyColumn(contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item { SectionTitle("Saved Deals", subtitle = "Deals you bookmarked for later") }
            when {
                state.isLoading -> item { EmptyState("Loading saved deals.", "Fetching your saved offers.") }
                state.errorMessage != null -> item { EmptyState("Saved deals unavailable.", state.errorMessage) }
                state.savedDeals.isEmpty() -> item { EmptyState("No saved deals yet.", "Tap the save button on any deal to keep it here.") }
                else -> items(state.savedDeals, key = { it.id.ifBlank { it.dealId } }) { saved ->
                    val deal = saved.toDealModel()
                    ProfileDealCard(
                        imageUrl = saved.imageUrl,
                        title = saved.productTitle,
                        platform = saved.platform,
                        price = saved.dealPrice,
                        originalPrice = saved.originalPrice,
                        discountPercent = saved.discountPercent,
                        metaText = saved.createdAt?.let { "Saved: $it" },
                        onViewDetails = { onOpenDealDetails(deal) },
                        onViewDeal = { onViewDeal(deal) },
                        onRemove = { onRemoveSavedDeal(deal) }
                    )
                }
            }
        }
    }
}
