package com.enjoyfreedeals.app.ui.home

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.enjoyfreedeals.app.data.model.CategoryModel
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.theme.SoftGreen
import com.enjoyfreedeals.app.ui.components.AppLogo
import com.enjoyfreedeals.app.ui.components.CategoryCard
import com.enjoyfreedeals.app.ui.components.DealCard
import com.enjoyfreedeals.app.ui.components.DealSearchBox
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.PriceComparisonCard
import com.enjoyfreedeals.app.ui.components.SectionTitle
import com.enjoyfreedeals.app.ui.components.formatPrice
import com.enjoyfreedeals.app.viewmodel.HomeUiState
import kotlinx.coroutines.delay

@Composable
fun HomeScreen(
    state: HomeUiState,
    onQueryChange: (String) -> Unit,
    onNotificationClick: () -> Unit,
    onCategoryClick: (CategoryModel) -> Unit,
    onViewDeal: (DealModel) -> Unit,
    onSaveDeal: (DealModel) -> Unit,
    onShareDeal: (DealModel) -> Unit,
    onOpenDealDetails: (DealModel) -> Unit,
    onStorePriceClick: (StorePriceModel) -> Unit,
    onPriceAlertClick: (DealModel) -> Unit,
    priceHistory: Map<String, List<PricePointModel>> = emptyMap(),
    priceDropAlerts: Set<String> = emptySet()
) {
    PremiumBackground {
        LazyColumn(
            contentPadding = PaddingValues(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                HomeHeader(
                    name = state.user.name.ifBlank { "Deal Hunter" },
                    unreadCount = state.unreadCount,
                    onNotificationClick = onNotificationClick
                )
            }
            item {
                DealSearchBox(value = state.query, onValueChange = onQueryChange)
            }
            item {
                PullToRefreshHint()
            }
            item {
                BannerSlider(deals = state.deals.filter { it.isFeatured || it.isHotDeal }.take(6), onViewDeal = onViewDeal)
            }
            item {
                SectionTitle("Category Shortcuts", "Explore deals by shopping need")
                Spacer(Modifier.height(10.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(state.categories.take(8), key = { it.categoryId }) { category ->
                        CategoryCard(category, onCategoryClick, Modifier.width(170.dp))
                    }
                }
            }
            item {
                DealSection("Featured Deals", state.deals.filter { it.isFeatured }.take(4), onViewDeal, onSaveDeal, onShareDeal, onOpenDealDetails, onPriceAlertClick, priceHistory, priceDropAlerts)
            }
            item {
                DealSection("Hot Deals", state.deals.filter { it.isHotDeal }.take(4), onViewDeal, onSaveDeal, onShareDeal, onOpenDealDetails, onPriceAlertClick, priceHistory, priceDropAlerts)
            }
            item {
                PriceComparisonHighlights(state.deals.take(3), onStorePriceClick)
            }
            item {
                DealSection("Free Deals", state.deals.filter { it.isFreeDeal }.take(4), onViewDeal, onSaveDeal, onShareDeal, onOpenDealDetails, onPriceAlertClick, priceHistory, priceDropAlerts)
            }
            item {
                DealSection("Today's Deals", state.deals.take(5), onViewDeal, onSaveDeal, onShareDeal, onOpenDealDetails, onPriceAlertClick, priceHistory, priceDropAlerts)
            }
            item {
                DealSection("Expiring Soon Deals", state.deals.sortedBy { it.expiryDate }.take(4), onViewDeal, onSaveDeal, onShareDeal, onOpenDealDetails, onPriceAlertClick, priceHistory, priceDropAlerts)
            }
            item {
                StoreWiseSection(state.deals, onViewDeal)
            }
        }
    }
}

@Composable
private fun PullToRefreshHint() {
    Surface(color = SoftGreen.copy(alpha = 0.72f), contentColor = PrimaryGreen, shape = RoundedCornerShape(18.dp)) {
        Text(
            "Pull to refresh ready for real-time deal loading",
            modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp),
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun HomeHeader(name: String, unreadCount: Int, onNotificationClick: () -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            AppLogo(modifier = Modifier.fillMaxWidth(0.72f), compact = true)
            Text("Hello, $name 👋", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Text("Fresh savings are waiting today", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        IconButton(
            onClick = onNotificationClick,
            modifier = Modifier.clip(CircleShape).background(AccentYellow.copy(alpha = 0.32f))
        ) {
            BadgedBox(
                badge = {
                    if (unreadCount > 0) {
                        Badge(containerColor = PrimaryRed, contentColor = Color.White) { Text(unreadCount.toString()) }
                    }
                }
            ) {
                Icon(Icons.Outlined.NotificationsActive, contentDescription = "Notifications", tint = PrimaryGreen)
            }
        }
    }
}

@Composable
private fun BannerSlider(deals: List<DealModel>, onViewDeal: (DealModel) -> Unit) {
    if (deals.isEmpty()) return
    var index by remember { mutableIntStateOf(0) }
    LaunchedEffect(deals) {
        while (true) {
            delay(3200)
            index = (index + 1) % deals.size
        }
    }
    Crossfade(targetState = deals[index], label = "home-banner") { deal ->
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(176.dp)
                    .background(Brush.linearGradient(listOf(PrimaryRed, PrimaryGreen, AccentYellow)))
                    .padding(18.dp)
            ) {
                AsyncImage(
                    model = deal.productImage,
                    contentDescription = deal.title,
                    modifier = Modifier.align(Alignment.CenterEnd).size(122.dp).clip(RoundedCornerShape(24.dp)),
                    contentScale = ContentScale.Crop
                )
                Column(Modifier.align(Alignment.CenterStart).fillMaxWidth(0.62f)) {
                    Surface(color = Color.White.copy(alpha = 0.18f), contentColor = Color.White, shape = RoundedCornerShape(50)) {
                        Text(deal.storeName, Modifier.padding(horizontal = 12.dp, vertical = 5.dp), fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(10.dp))
                    Text("${deal.discountPercent}% OFF", color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                    Text(deal.title, color = Color.White.copy(alpha = 0.92f), maxLines = 2, overflow = TextOverflow.Ellipsis)
                    Spacer(Modifier.height(10.dp))
                    Button(onClick = { onViewDeal(deal) }, colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = PrimaryGreen), shape = RoundedCornerShape(16.dp)) {
                        Text("View Deal", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun DealSection(
    title: String,
    deals: List<DealModel>,
    onViewDeal: (DealModel) -> Unit,
    onSaveDeal: (DealModel) -> Unit,
    onShareDeal: (DealModel) -> Unit,
    onOpenDealDetails: (DealModel) -> Unit,
    onPriceAlertClick: (DealModel) -> Unit,
    priceHistory: Map<String, List<PricePointModel>>,
    priceDropAlerts: Set<String>
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionTitle(title)
        if (deals.isEmpty()) {
            EmptyState("No deals found right now.", "Please check again shortly.")
        } else {
            deals.forEach { deal ->
                DealCard(
                    deal = deal,
                    isSaved = false,
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
    }
}

@Composable
private fun PriceComparisonHighlights(
    deals: List<DealModel>,
    onStorePriceClick: (StorePriceModel) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionTitle("Best Price Comparison", "Compare prices across Amazon, Flipkart, Meesho and more")
        if (deals.isEmpty()) {
            EmptyState("No comparison data yet.", "Price comparison API data will appear here.")
        } else {
            deals.forEach { deal ->
                PriceComparisonCard(deal = deal, onStoreClick = onStorePriceClick)
            }
        }
    }
}

@Composable
private fun StoreWiseSection(deals: List<DealModel>, onViewDeal: (DealModel) -> Unit) {
    val stores = deals.groupBy { it.storeName }.entries.take(10)
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionTitle("Featured Stores", "Quick jump to popular online stores")
        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            items(stores.toList(), key = { it.key }) { entry ->
                val best = entry.value.maxByOrNull { it.discountPercent } ?: return@items
                Card(
                    modifier = Modifier.width(170.dp).clickable { onViewDeal(best) },
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Text(entry.key, fontWeight = FontWeight.Black)
                        Text("${entry.value.size} active deals", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.height(8.dp))
                        Text("From ${formatPrice(best.effectivePrice)}", color = PrimaryGreen, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}
