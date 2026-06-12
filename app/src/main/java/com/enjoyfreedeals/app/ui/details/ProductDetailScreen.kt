package com.enjoyfreedeals.app.ui.details

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material.icons.outlined.Star
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
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.enjoyfreedeals.app.R
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.DarkText
import com.enjoyfreedeals.app.theme.GreyText
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.theme.SoftYellow
import com.enjoyfreedeals.app.ui.components.BuyScoreCard
import com.enjoyfreedeals.app.ui.components.DealCard
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.PriceComparisonSection
import com.enjoyfreedeals.app.ui.components.PriceSummaryCards
import com.enjoyfreedeals.app.ui.components.SectionTitle
import com.enjoyfreedeals.app.ui.components.formatPrice
import com.enjoyfreedeals.app.ui.components.formatTimeAgo
import com.enjoyfreedeals.app.ui.components.formatUpdatedStatus
import com.enjoyfreedeals.app.ui.components.preferredUpdateTime
import com.enjoyfreedeals.app.utils.LocalAppStrings
import com.enjoyfreedeals.app.viewmodel.BuyScoreViewModel
import java.util.Locale

@Composable
fun ProductDetailScreen(
    deal: DealModel?,
    allDeals: List<DealModel>,
    onViewDeal: (DealModel) -> Unit,
    onSaveDeal: (DealModel) -> Unit,
    onShareDeal: (DealModel) -> Unit,
    onStorePriceClick: (StorePriceModel) -> Unit,
    onSimilarDealClick: (DealModel) -> Unit,
    priceHistory: List<PricePointModel> = emptyList(),
    isPriceAlertEnabled: Boolean = false,
    onPriceAlertClick: (DealModel) -> Unit = {},
    buyScoreViewModel: BuyScoreViewModel = viewModel()
) {
    val strings = LocalAppStrings.current
    PremiumBackground {
        if (deal == null) {
            LazyColumn(contentPadding = PaddingValues(18.dp)) {
                item { EmptyState("Product not found.", "Please select another deal.") }
            }
            return@PremiumBackground
        }

        val detailHistory = priceHistory.ifEmpty {
            listOf(DealRepository.buildPriceHistoryRecord(deal, emptyList(), deal.priceCheckedAt))
        }
        val stats = DealRepository.calculatePriceStats(deal, detailHistory)
        val similarDeals = allDeals
            .filter { it.dealId != deal.dealId && it.categoryId == deal.categoryId }
            .take(6)
        val buyScoreState by buyScoreViewModel.uiState.collectAsState()

        LaunchedEffect(deal.dealId, deal.updatedAt, deal.currentPrice) {
            buyScoreViewModel.loadBuyScore(deal)
        }

        LazyColumn(
            contentPadding = PaddingValues(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Card(
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
                ) {
                    Column {
                        AsyncImage(
                            model = deal.displayImageUrl,
                            contentDescription = deal.title,
                            modifier = Modifier.fillMaxWidth().height(260.dp),
                            contentScale = ContentScale.Fit,
                            placeholder = painterResource(R.drawable.enjoyfreedeals_logo),
                            error = painterResource(R.drawable.enjoyfreedeals_logo)
                        )
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text(deal.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text(deal.storeName, color = PrimaryGreen, fontWeight = FontWeight.Bold)
                                if (deal.isVerified) Badge("Verified", PrimaryGreen, Color.White)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(formatPrice(stats.currentPrice), color = PrimaryGreen, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                                Spacer(Modifier.size(10.dp))
                                Text(formatPrice(deal.originalPrice), color = GreyText, textDecoration = TextDecoration.LineThrough)
                                Spacer(Modifier.size(8.dp))
                                Badge("${deal.discountPercent}% OFF", AccentYellow, DarkText)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Outlined.Star, contentDescription = null, tint = AccentYellow, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.size(4.dp))
                                Text(String.format(Locale.US, "%.1f", deal.rating), fontWeight = FontWeight.Bold)
                                Spacer(Modifier.size(14.dp))
                                Text(deal.deliveryInfo, color = GreyText)
                            }
                            Text(
                                formatUpdatedStatus(preferredUpdateTime(deal)),
                                color = GreyText,
                                style = MaterialTheme.typography.labelMedium
                            )
                            deal.sourceUpdatedAt?.let { sourceUpdatedAt ->
                                Text(
                                    "Source updated ${formatTimeAgo(sourceUpdatedAt)}",
                                    color = GreyText,
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                            Text(deal.description, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
            if (deal.couponCode.isNotBlank()) {
                item {
                    Surface(color = SoftYellow, contentColor = DarkText, shape = RoundedCornerShape(20.dp)) {
                        Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Coupon Code", color = GreyText, style = MaterialTheme.typography.labelMedium)
                                Text(deal.couponCode, fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge)
                            }
                            Badge("Apply at checkout", PrimaryRed, Color.White)
                        }
                    }
                }
            }
            buyScoreState.buyScoreModel?.let { buyScore ->
                item {
                    BuyScoreCard(
                        buyScoreModel = buyScore,
                        selectedRange = buyScoreState.selectedRange,
                        onRangeSelected = buyScoreViewModel::selectRange
                    )
                }
            }
            item {
                PriceSummaryCards(stats = stats)
            }
            item {
                PriceComparisonSection(
                    prices = deal.comparisonPrices,
                    lastCheckedAt = deal.lastPriceCheckedAt ?: deal.priceCheckedAt,
                    onStoreClick = onStorePriceClick
                )
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    Button(
                        onClick = { onViewDeal(deal) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                        shape = RoundedCornerShape(18.dp)
                    ) {
                        Icon(Icons.Outlined.LocalOffer, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.size(8.dp))
                        Text(if (deal.couponCode.isNotBlank()) "Get Coupon" else strings.viewDeal, fontWeight = FontWeight.Bold)
                    }
                    IconButton(onClick = { onSaveDeal(deal) }) {
                        Icon(Icons.Outlined.FavoriteBorder, contentDescription = strings.saveDeal, tint = PrimaryRed)
                    }
                    IconButton(onClick = { onShareDeal(deal) }) {
                        Icon(Icons.Outlined.Share, contentDescription = strings.shareDeal, tint = PrimaryGreen)
                    }
                }
            }
            item {
                SectionTitle("Similar Deals", subtitle = "More offers from ${deal.categoryName}")
                Spacer(Modifier.height(10.dp))
                if (similarDeals.isEmpty()) {
                    EmptyState("No similar deals yet.", "More products will appear here soon.")
                } else {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(similarDeals, key = { it.dealId }) { similar ->
                            DealCard(
                                deal = similar,
                                isSaved = false,
                                onViewDeal = onViewDeal,
                                onSaveDeal = onSaveDeal,
                                onShareDeal = onShareDeal,
                                onOpenDetails = onSimilarDealClick,
                                modifier = Modifier.width(330.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Badge(text: String, background: Color, contentColor: Color) {
    Surface(color = background, contentColor = contentColor, shape = RoundedCornerShape(50)) {
        Text(text, modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp), style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Black)
    }
}
