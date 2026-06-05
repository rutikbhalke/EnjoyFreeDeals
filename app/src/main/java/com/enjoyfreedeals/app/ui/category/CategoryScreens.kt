package com.enjoyfreedeals.app.ui.category

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.CategoryModel
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.ui.components.CategoryCard
import com.enjoyfreedeals.app.ui.components.DealCard
import com.enjoyfreedeals.app.ui.components.DealSearchBox
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.FilterRow
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.SectionTitle
import com.enjoyfreedeals.app.utils.Constants
import com.enjoyfreedeals.app.viewmodel.CategoryUiState

@Composable
fun CategoryScreen(
    state: CategoryUiState,
    onCategoryClick: (CategoryModel) -> Unit
) {
    PremiumBackground {
        LazyVerticalGrid(
            columns = GridCells.Adaptive(150.dp),
            contentPadding = PaddingValues(18.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item(span = { GridItemSpan(maxLineSpan) }) {
                SectionTitle("Categories", subtitle = "Tap a category to view matching deals")
            }
            if (state.isLoading) {
                item(span = { GridItemSpan(maxLineSpan) }) {
                    EmptyState("Loading categories.", "Fetching live shopping categories.")
                }
            } else if (state.errorMessage != null) {
                item(span = { GridItemSpan(maxLineSpan) }) {
                    EmptyState("Categories unavailable.", state.errorMessage)
                }
            } else {
                items(state.categories, key = { it.categoryId }) { category ->
                    CategoryCard(category = category, onClick = onCategoryClick)
                }
            }
        }
    }
}

@Composable
fun CategoryDealsScreen(
    state: CategoryUiState,
    onSearch: (String) -> Unit,
    onSort: (String) -> Unit,
    onViewDeal: (DealModel) -> Unit,
    onSaveDeal: (DealModel) -> Unit,
    onShareDeal: (DealModel) -> Unit,
    onOpenDealDetails: (DealModel) -> Unit,
    onPriceAlertClick: (DealModel) -> Unit,
    priceHistory: Map<String, List<PricePointModel>> = emptyMap(),
    priceDropAlerts: Set<String> = emptySet(),
    savedDeals: Set<String> = emptySet()
) {
    PremiumBackground {
        LazyColumn(
            contentPadding = PaddingValues(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                SectionTitle(
                    title = state.selectedCategory?.categoryName ?: "Category Deals",
                    subtitle = state.selectedCategory?.description ?: "Category-wise realtime deals"
                )
            }
            item {
                DealSearchBox(state.query, onSearch)
            }
            item {
                FilterRow(Constants.sortOptions, state.sortOption, onSort)
            }
            if (state.isLoading) {
                item {
                    EmptyState("Loading category deals.", "Fetching live offers.")
                }
            } else if (state.errorMessage != null) {
                item {
                    EmptyState("Category deals unavailable.", state.errorMessage)
                }
            } else if (state.categoryDeals.isEmpty()) {
                item {
                    EmptyState("No deals available in this category right now.", "Please check another category.")
                }
            } else {
                items(state.categoryDeals, key = { it.dealId }) { deal ->
                    DealCard(
                        deal = deal,
                        isSaved = savedDeals.contains(deal.dealId),
                        onViewDeal = onViewDeal,
                        onSaveDeal = onSaveDeal,
                        onShareDeal = onShareDeal,
                        priceHistory = priceHistory[deal.dealId].orEmpty(),
                        isPriceAlertEnabled = priceDropAlerts.contains(deal.dealId),
                        onOpenDetails = onOpenDealDetails,
                        onPriceAlertClick = onPriceAlertClick
                    )
                }
            }
            item { Spacer(Modifier.height(10.dp)) }
        }
    }
}
