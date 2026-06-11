package com.enjoyfreedeals.app.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.SharedDealModel
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.ProfileDealCard
import com.enjoyfreedeals.app.ui.components.SectionTitle

@Composable
fun SharedDealsScreen(
    deals: List<SharedDealModel>,
    isLoading: Boolean,
    onViewDeal: (DealModel) -> Unit,
    onOpenDealDetails: (DealModel) -> Unit
) {
    PremiumBackground {
        LazyColumn(contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item { SectionTitle("Shared Deals", subtitle = "Deals you shared from this phone") }
            when {
                isLoading -> item { EmptyState("Loading shared deals.", "Fetching your share history.") }
                deals.isEmpty() -> item { EmptyState("No shared deals yet.", "Share a deal to see it here.") }
                else -> items(deals, key = { it.id.ifBlank { "${it.dealId}-${it.createdAt.orEmpty()}" } }) { shared ->
                    val deal = shared.toDealModel()
                    val meta = listOfNotNull(
                        shared.createdAt?.let { "Shared: $it" },
                        shared.sharePlatform?.takeIf { it.isNotBlank() }?.let { "Platform: $it" },
                        shared.sharedTo?.takeIf { it.isNotBlank() }?.let { "To: $it" }
                    ).joinToString("  |  ")
                    ProfileDealCard(
                        imageUrl = shared.imageUrl,
                        title = shared.productTitle,
                        platform = shared.platform,
                        price = shared.dealPrice,
                        metaText = meta,
                        onViewDetails = { onOpenDealDetails(deal) },
                        onViewDeal = { onViewDeal(deal) }
                    )
                }
            }
        }
    }
}
