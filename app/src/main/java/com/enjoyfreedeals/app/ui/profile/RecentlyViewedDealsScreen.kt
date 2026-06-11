package com.enjoyfreedeals.app.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.RecentlyViewedDealModel
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.ProfileDealCard
import com.enjoyfreedeals.app.ui.components.SectionTitle

@Composable
fun RecentlyViewedDealsScreen(
    deals: List<RecentlyViewedDealModel>,
    isLoading: Boolean,
    onViewDeal: (DealModel) -> Unit,
    onOpenDealDetails: (DealModel) -> Unit
) {
    PremiumBackground {
        LazyColumn(contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item { SectionTitle("Recently Viewed", subtitle = "Latest viewed deals first") }
            when {
                isLoading -> item { EmptyState("Loading recently viewed deals.", "Fetching your latest product views.") }
                deals.isEmpty() -> item { EmptyState("No recently viewed deals yet.", "Open a product detail page to see it here.") }
                else -> items(deals, key = { it.id.ifBlank { it.dealId } }) { viewed ->
                    val deal = viewed.toDealModel()
                    ProfileDealCard(
                        imageUrl = viewed.imageUrl,
                        title = viewed.productTitle,
                        platform = viewed.platform,
                        price = viewed.dealPrice,
                        originalPrice = viewed.originalPrice,
                        discountPercent = viewed.discountPercent,
                        metaText = viewed.viewedAt?.let { "Viewed: $it" },
                        onViewDetails = { onOpenDealDetails(deal) },
                        onViewDeal = { onViewDeal(deal) }
                    )
                }
            }
        }
    }
}
