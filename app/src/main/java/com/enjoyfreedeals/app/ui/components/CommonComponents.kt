package com.enjoyfreedeals.app.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.TrendingDown
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CardGiftcard
import androidx.compose.material.icons.outlined.Celebration
import androidx.compose.material.icons.outlined.Checkroom
import androidx.compose.material.icons.outlined.ConfirmationNumber
import androidx.compose.material.icons.outlined.Devices
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.LocalGroceryStore
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.NotificationsOff
import androidx.compose.material.icons.outlined.PhoneAndroid
import androidx.compose.material.icons.outlined.Restaurant
import androidx.compose.material.icons.outlined.School
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material.icons.outlined.Spa
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.TravelExplore
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.core.graphics.toColorInt
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.compose.SubcomposeAsyncImage
import com.enjoyfreedeals.app.R
import com.enjoyfreedeals.app.data.model.BlogModel
import com.enjoyfreedeals.app.data.model.CategoryModel
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.CardWhite
import com.enjoyfreedeals.app.theme.DarkText
import com.enjoyfreedeals.app.theme.GreyText
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.theme.SoftGreen
import com.enjoyfreedeals.app.theme.SoftYellow
import com.enjoyfreedeals.app.utils.LocalAppStrings
import java.text.SimpleDateFormat
import java.text.NumberFormat
import java.util.Date
import java.util.Locale

@Composable
fun PremiumBackground(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.background,
                        SoftGreen.copy(alpha = 0.55f),
                        SoftYellow.copy(alpha = 0.45f)
                    )
                )
            )
    ) {
        BackgroundBubble(Modifier.align(Alignment.TopStart).padding(top = 42.dp).size(190.dp), PrimaryRed.copy(alpha = 0.09f))
        BackgroundBubble(Modifier.align(Alignment.BottomEnd).padding(bottom = 80.dp).size(230.dp), PrimaryGreen.copy(alpha = 0.12f))
        content()
    }
}

@Composable
private fun BackgroundBubble(modifier: Modifier, color: Color) {
    val transition = rememberInfiniteTransition(label = "bubble")
    val scale by transition.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(tween(2600), RepeatMode.Reverse),
        label = "bubble-scale"
    )
    Box(
        modifier = modifier
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .clip(CircleShape)
            .background(color)
    )
}

@Composable
fun SparkleCanvas(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "sparkles")
    val progress by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1700), RepeatMode.Restart),
        label = "sparkle-progress"
    )
    Canvas(modifier = modifier) {
        val points = listOf(
            Offset(size.width * 0.18f, size.height * 0.22f) to AccentYellow,
            Offset(size.width * 0.82f, size.height * 0.24f) to PrimaryRed,
            Offset(size.width * 0.24f, size.height * 0.72f) to PrimaryGreen,
            Offset(size.width * 0.74f, size.height * 0.68f) to AccentYellow
        )
        points.forEachIndexed { index, item ->
            val pulse = ((progress + index * 0.18f) % 1f)
            drawCircle(item.second.copy(alpha = 0.45f * (1f - pulse)), radius = 5.dp.toPx() + pulse * 14.dp.toPx(), center = item.first)
            drawCircle(Color.White.copy(alpha = 0.92f), radius = 2.4.dp.toPx(), center = item.first)
        }
    }
}

@Composable
fun AppLogo(modifier: Modifier = Modifier, compact: Boolean = false) {
    Image(
        painter = painterResource(R.drawable.enjoyfreedeals_logo),
        contentDescription = "EnjoyFreeDeals logo",
        modifier = modifier
            .fillMaxWidth(if (compact) 0.58f else 0.86f)
            .height(if (compact) 48.dp else 90.dp),
        contentScale = ContentScale.Fit
    )
}

@Composable
fun SectionTitle(title: String, modifier: Modifier = Modifier, subtitle: String? = null) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
        if (!subtitle.isNullOrBlank()) {
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun DealSearchBox(value: String, onValueChange: (String) -> Unit, modifier: Modifier = Modifier) {
    val strings = LocalAppStrings.current
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier
            .fillMaxWidth()
            .shadow(8.dp, RoundedCornerShape(22.dp))
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(22.dp)),
        leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null, tint = PrimaryGreen) },
        placeholder = { Text(strings.searchHint) },
        shape = RoundedCornerShape(22.dp),
        singleLine = true,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = PrimaryGreen,
            unfocusedBorderColor = Color.Transparent,
            focusedContainerColor = MaterialTheme.colorScheme.surface,
            unfocusedContainerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun FilterRow(options: List<String>, selected: String, onSelected: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        options.forEach { option ->
            FilterChip(
                selected = selected == option,
                onClick = { onSelected(option) },
                label = { Text(option, maxLines = 1) }
            )
        }
    }
}

@Composable
fun DealCard(
    deal: DealModel,
    isSaved: Boolean,
    onViewDeal: (DealModel) -> Unit,
    onSaveDeal: (DealModel) -> Unit,
    onShareDeal: (DealModel) -> Unit,
    modifier: Modifier = Modifier,
    priceHistory: List<PricePointModel> = emptyList(),
    isPriceAlertEnabled: Boolean = false,
    onTogglePriceAlert: ((DealModel) -> Unit)? = null,
    onOpenDetails: ((DealModel) -> Unit)? = null,
    onPriceAlertClick: ((DealModel) -> Unit)? = null
) {
    val effectiveHistory = priceHistory.ifEmpty {
        listOf(DealRepository.buildPriceHistoryRecord(deal, emptyList(), deal.priceCheckedAt))
    }
    val stats = DealRepository.calculatePriceStats(deal, effectiveHistory)
    val strings = LocalAppStrings.current
    val cardModifier = if (onOpenDetails != null) {
        modifier
            .fillMaxWidth()
            .clickable { onOpenDetails(deal) }
    } else {
        modifier.fillMaxWidth()
    }
    Card(
        modifier = cardModifier,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 5.dp)
    ) {
        Column {
            Box {
                SubcomposeAsyncImage(
                    model = deal.displayImageUrl,
                    contentDescription = deal.title,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(172.dp),
                    contentScale = ContentScale.Fit,
                    error = {
                        Box(Modifier.fillMaxSize().background(SoftGreen), contentAlignment = Alignment.Center) {
                            Image(
                                painter = painterResource(R.drawable.enjoyfreedeals_logo),
                                contentDescription = deal.title,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(18.dp),
                                contentScale = ContentScale.Fit
                            )
                        }
                    },
                    loading = { ShimmerBlock(Modifier.fillMaxSize()) }
                )
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    BadgeText("${deal.discountPercent}% OFF", AccentYellow, DarkText)
                    if (deal.isHotDeal) BadgeText("HOT", PrimaryRed, Color.White)
                }
            }
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StorePill(deal.storeName)
                    if (deal.isVerified) {
                        Spacer(Modifier.width(6.dp))
                        BadgeText("Verified", PrimaryGreen, Color.White)
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    listOfNotNull(
                        formatUpdatedStatus(preferredUpdateTime(deal))
                    ).joinToString(" - "),
                    color = GreyText,
                    style = MaterialTheme.typography.labelSmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(8.dp))
                Text(deal.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(4.dp))
                Text(deal.dealType.toDisplayLabel(), color = GreyText, style = MaterialTheme.typography.labelMedium)
                Spacer(Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Star, contentDescription = null, tint = AccentYellow, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(String.format(Locale.US, "%.1f", deal.rating), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.LocalShipping, contentDescription = null, tint = PrimaryGreen, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(deal.deliveryInfo, color = GreyText, style = MaterialTheme.typography.labelMedium)
                    }
                }
                Spacer(Modifier.height(10.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(formatPrice(stats.currentPrice), color = PrimaryGreen, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                    Spacer(Modifier.width(8.dp))
                    Text(formatPrice(deal.originalPrice), color = GreyText, textDecoration = TextDecoration.LineThrough)
                    if (deal.couponCode.isNotBlank()) {
                        Spacer(Modifier.width(8.dp))
                        BadgeText(deal.couponCode, SoftYellow, DarkText)
                    }
                }
                if (deal.lowestPrice > 0.0) {
                    Spacer(Modifier.height(8.dp))
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(enabled = onOpenDetails != null) { onOpenDetails?.invoke(deal) },
                        shape = RoundedCornerShape(14.dp),
                        color = SoftGreen.copy(alpha = 0.82f),
                        border = BorderStroke(1.dp, PrimaryGreen.copy(alpha = 0.18f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text("Lowest price: ${formatPrice(deal.lowestPrice)}", color = PrimaryGreen, fontWeight = FontWeight.Black, style = MaterialTheme.typography.labelMedium)
                                Text(
                                    listOfNotNull(
                                        deal.bestPlatform.takeIf { it.isNotBlank() },
                                        deal.comparisonCount.takeIf { it > 0 }?.let { "$it platforms" }
                                    ).joinToString(" - ").ifBlank { "Compare prices" },
                                    color = GreyText,
                                    style = MaterialTheme.typography.labelSmall,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            Text("Compare", color = PrimaryGreen, fontWeight = FontWeight.Black, style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { onViewDeal(deal) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Icon(Icons.Outlined.LocalOffer, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(if (deal.couponCode.isNotBlank()) "Get Coupon" else strings.viewDeal, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = { onOpenDetails?.invoke(deal) },
                        modifier = Modifier.weight(1f),
                        enabled = onOpenDetails != null,
                        colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = DarkText),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(strings.viewDetails, fontWeight = FontWeight.Bold)
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    OutlinedActionButton(
                        label = strings.saveDeal,
                        icon = if (isSaved) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder,
                        onClick = { onSaveDeal(deal) },
                        modifier = Modifier.weight(1f),
                        tint = if (isSaved) PrimaryRed else PrimaryGreen
                    )
                    OutlinedActionButton(
                        label = strings.shareDeal,
                        icon = Icons.Outlined.Share,
                        onClick = { onShareDeal(deal) },
                        modifier = Modifier.weight(1f),
                        tint = PrimaryGreen
                    )
                    if (onPriceAlertClick != null || onTogglePriceAlert != null) {
                        IconButton(onClick = { (onPriceAlertClick ?: onTogglePriceAlert)?.invoke(deal) }) {
                            Icon(
                                if (isPriceAlertEnabled) Icons.Outlined.NotificationsActive else Icons.Outlined.NotificationsOff,
                                contentDescription = "Price alert",
                                tint = if (isPriceAlertEnabled) PrimaryRed else GreyText
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OutlinedActionButton(
    label: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    tint: Color = PrimaryGreen
) {
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, tint.copy(alpha = 0.24f))
    ) {
        Row(Modifier.padding(horizontal = 10.dp, vertical = 9.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(17.dp))
            Spacer(Modifier.width(6.dp))
            Text(label, color = tint, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium, maxLines = 1)
        }
    }
}

@Composable
fun PriceComparisonCard(
    deal: DealModel,
    onStoreClick: (StorePriceModel) -> Unit,
    modifier: Modifier = Modifier
) {
    val strings = LocalAppStrings.current
    val prices = deal.comparisonPrices
    if (prices.isEmpty()) return

    val lowest = prices.filter { it.available }.minByOrNull { it.price }
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            SectionTitle(strings.priceComparison, subtitle = "Last updated ${formatDate(deal.priceCheckedAt)}")
            prices.forEach { price ->
                StorePriceRow(
                    price = price,
                    isBestPrice = lowest?.platform == price.platform && price.available,
                    onClick = { onStoreClick(price) }
                )
            }
        }
    }
}

@Composable
fun StorePriceRow(
    price: StorePriceModel,
    isBestPrice: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val strings = LocalAppStrings.current
    Surface(
        modifier = modifier.fillMaxWidth().clickable(enabled = price.available, onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = if (isBestPrice) SoftGreen.copy(alpha = 0.78f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.58f),
        border = BorderStroke(1.dp, if (isBestPrice) PrimaryGreen.copy(alpha = 0.32f) else GreyText.copy(alpha = 0.08f))
    ) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            StorePill(price.platform)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(if (price.available) price.deliveryInfo else "Not available", color = GreyText, style = MaterialTheme.typography.labelMedium)
                if (price.couponCode.isNotBlank()) {
                    Text(price.couponCode, color = PrimaryRed, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(if (price.available) formatPrice(price.price) else "N/A", color = if (isBestPrice) PrimaryGreen else DarkText, fontWeight = FontWeight.Black)
                if (isBestPrice) {
                    BadgeText(strings.bestPrice, PrimaryGreen, Color.White)
                }
            }
        }
    }
}

@Composable
fun PriceTrackingPanel(
    deal: DealModel,
    history: List<PricePointModel>,
    isAlertEnabled: Boolean,
    onToggleAlert: ((DealModel) -> Unit)?
) {
    val stats = DealRepository.calculatePriceStats(deal, history)
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.AutoMirrored.Outlined.TrendingDown, contentDescription = null, tint = PrimaryGreen, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Column(Modifier.weight(1f)) {
                    Text("Price History", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleSmall)
                    val subtitle = when {
                        stats.isLowestPriceNow -> "Lowest price right now"
                        stats.dropFromAveragePercent > 0 -> "${stats.dropFromAveragePercent}% below average"
                        else -> "Tracking ${history.size} price points"
                    }
                    Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelMedium)
                }
                if (onToggleAlert != null) {
                    IconButton(onClick = { onToggleAlert(deal) }) {
                        Icon(
                            imageVector = if (isAlertEnabled) Icons.Outlined.NotificationsActive else Icons.Outlined.NotificationsOff,
                            contentDescription = if (isAlertEnabled) "Disable price drop alert" else "Enable price drop alert",
                            tint = if (isAlertEnabled) PrimaryRed else PrimaryGreen
                        )
                    }
                }
            }
            PriceInsightBadges(deal = deal, stats = stats)
            PriceStatsRow(stats.currentPrice, stats.averagePrice, stats.highestPrice, stats.lowestPrice)
            PriceGraph(history = history, modifier = Modifier.fillMaxWidth().height(118.dp))
        }
    }
}

@Composable
fun PriceGraph(history: List<PricePointModel>, modifier: Modifier = Modifier) {
    if (history.isEmpty()) {
        ShimmerBlock(modifier)
        return
    }
    val points = history.sortedBy { it.recordedAt }
    val prices = points.map { it.price }
    val min = prices.minOrNull() ?: 0.0
    val max = prices.maxOrNull() ?: 0.0
    val average = prices.average()
    val range = (max - min).takeIf { it > 0.0 } ?: 1.0
    Canvas(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.72f), SoftGreen.copy(alpha = 0.54f))))
            .border(1.dp, PrimaryGreen.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
            .padding(10.dp)
    ) {
        val horizontalPadding = 16.dp.toPx()
        val verticalPadding = 14.dp.toPx()
        val graphWidth = size.width - horizontalPadding * 2
        val graphHeight = size.height - verticalPadding * 2
        val step = if (points.size > 1) graphWidth / (points.size - 1) else graphWidth
        val path = Path()
        val areaPath = Path()
        fun yFor(price: Double): Float {
            val normalized = ((price - min) / range).toFloat()
            return verticalPadding + graphHeight - normalized * graphHeight
        }
        points.forEachIndexed { index, point ->
            val x = horizontalPadding + step * index
            val y = yFor(point.price)
            if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
            if (index == 0) areaPath.moveTo(x, size.height - verticalPadding)
            areaPath.lineTo(x, y)
            if (index == points.lastIndex) {
                areaPath.lineTo(x, size.height - verticalPadding)
                areaPath.close()
            }
        }
        drawLine(
            color = GreyText.copy(alpha = 0.18f),
            start = Offset(horizontalPadding, verticalPadding),
            end = Offset(horizontalPadding, size.height - verticalPadding),
            strokeWidth = 1.dp.toPx()
        )
        drawLine(
            color = GreyText.copy(alpha = 0.18f),
            start = Offset(horizontalPadding, size.height - verticalPadding),
            end = Offset(size.width - horizontalPadding, size.height - verticalPadding),
            strokeWidth = 1.dp.toPx()
        )
        drawLine(
            color = AccentYellow.copy(alpha = 0.72f),
            start = Offset(horizontalPadding, yFor(average)),
            end = Offset(size.width - horizontalPadding, yFor(average)),
            strokeWidth = 1.5.dp.toPx()
        )
        drawPath(
            path = areaPath,
            color = PrimaryGreen.copy(alpha = 0.14f)
        )
        drawPath(
            path = path,
            color = PrimaryGreen,
            style = Stroke(width = 3.dp.toPx())
        )
        points.forEachIndexed { index, point ->
            val x = horizontalPadding + step * index
            val y = yFor(point.price)
            if (index == points.lastIndex || point.price == min || point.price == max) {
                drawCircle(
                    color = when {
                        index == points.lastIndex -> PrimaryGreen
                        point.price == min -> PrimaryRed
                        else -> AccentYellow
                    },
                    radius = 6.dp.toPx(),
                    center = Offset(x, y)
                )
                drawCircle(
                    color = Color.White,
                    radius = 4.dp.toPx(),
                    center = Offset(x, y)
                )
            }
        }
    }
}

@Composable
private fun PriceStatsRow(currentPrice: Double, averagePrice: Double, highestPrice: Double, lowestPrice: Double) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        PriceStat("Current", currentPrice, Modifier.weight(1f))
        PriceStat("Low", lowestPrice, Modifier.weight(1f))
        PriceStat("Avg", averagePrice, Modifier.weight(1f))
        PriceStat("High", highestPrice, Modifier.weight(1f))
    }
}

@Composable
private fun PriceInsightBadges(deal: DealModel, stats: com.enjoyfreedeals.app.data.model.PriceStatsModel) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.horizontalScroll(rememberScrollState())) {
        if (stats.isLowestPriceNow) BadgeText("Lowest Price", PrimaryGreen, Color.White)
        if (deal.isHotDeal || deal.discountPercent > 50) BadgeText("Hot Deal", PrimaryRed, Color.White)
        if (stats.dropFromAveragePercent > 0) BadgeText("Below Average", AccentYellow, DarkText)
        if (stats.dropFromAveragePercent >= 5) BadgeText("Price Dropped", SoftGreen, PrimaryGreen)
    }
}

@Composable
private fun PriceStat(label: String, price: Double, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = Color.White.copy(alpha = 0.72f),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, PrimaryGreen.copy(alpha = 0.10f))
    ) {
        Column(Modifier.padding(horizontal = 8.dp, vertical = 7.dp)) {
            Text(label, color = GreyText, style = MaterialTheme.typography.labelSmall)
            Text(formatPrice(price), color = DarkText, fontWeight = FontWeight.Black, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun CategoryCard(category: CategoryModel, onClick: (CategoryModel) -> Unit, modifier: Modifier = Modifier) {
    val scale by animateFloatAsState(targetValue = 1f, animationSpec = tween(450), label = "category-scale")
    val color1 = parseColor(category.gradientColor1, PrimaryRed)
    val color2 = parseColor(category.gradientColor2, PrimaryGreen)
    Card(
        modifier = modifier
            .height(154.dp)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .clickable { onClick(category) },
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 5.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.linearGradient(listOf(color1.copy(alpha = 0.88f), color2.copy(alpha = 0.88f))))
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Surface(color = Color.White.copy(alpha = 0.22f), shape = RoundedCornerShape(16.dp)) {
                Icon(categoryIcon(category.categoryId), contentDescription = null, tint = Color.White, modifier = Modifier.padding(10.dp))
            }
            Column {
                Text(category.categoryName, color = Color.White, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("${category.dealCount} deals", color = Color.White.copy(alpha = 0.9f), style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
fun BlogCard(blog: BlogModel, onReadMore: (BlogModel) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column {
            AsyncImage(blog.image, contentDescription = blog.title, modifier = Modifier.fillMaxWidth().height(155.dp), contentScale = ContentScale.Crop)
            Column(Modifier.padding(16.dp)) {
                Text(blog.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                Text(blog.shortDescription, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                    Text("${blog.author} - ${formatDate(blog.createdAt)}", style = MaterialTheme.typography.labelMedium, color = GreyText)
                    Button(onClick = { onReadMore(blog) }, colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed), shape = RoundedCornerShape(14.dp)) {
                        Text("Read More", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun EmptyState(title: String, subtitle: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Outlined.ShoppingBag, contentDescription = null, tint = PrimaryGreen, modifier = Modifier.size(42.dp))
            Spacer(Modifier.height(10.dp))
            Text(title, fontWeight = FontWeight.Black)
            Text(subtitle, color = GreyText, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun ShimmerBlock(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val alpha by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(tween(900), RepeatMode.Reverse),
        label = "shimmer-alpha"
    )
    Box(modifier.background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = alpha)))
}

@Composable
private fun BadgeText(text: String, background: Color, content: Color) {
    Surface(color = background, contentColor = content, shape = RoundedCornerShape(50)) {
        Text(text, modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun StorePill(storeName: String) {
    Surface(
        color = SoftGreen,
        contentColor = PrimaryGreen,
        shape = RoundedCornerShape(50),
        border = BorderStroke(1.dp, PrimaryGreen.copy(alpha = 0.14f))
    ) {
        Text(storeName, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp), style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
    }
}

fun formatPrice(price: Double): String =
    if (price <= 0.0) {
        "Free"
    } else {
        NumberFormat.getCurrencyInstance(Locale.Builder().setLanguage("en").setRegion("IN").build()).format(price).replace(".00", "")
    }

fun formatDate(timestamp: Long): String =
    SimpleDateFormat("dd MMM yyyy", Locale.US).format(Date(timestamp))

fun formatScrapedAt(timestamp: Long): String =
    SimpleDateFormat("dd MMM, hh:mm a", Locale.US).format(Date(timestamp))

fun formatFetchedStatus(timestamp: Long?): String =
    "Fetched ${formatTimeAgo(timestamp)}"

fun formatUpdatedStatus(timestamp: Long?): String =
    "Updated ${formatTimeAgo(timestamp)}"

fun preferredUpdateTime(deal: DealModel): Long? =
    deal.sourceUpdatedAt ?: deal.lastCheckedAt.takeIf { it > 0L } ?: deal.fetchedAt.takeIf { it > 0L }

fun formatTimeAgo(timestamp: Long?): String {
    val value = timestamp ?: return "time unknown"
    val elapsed = (System.currentTimeMillis() - value).coerceAtLeast(0L)
    val minutes = elapsed / (60L * 1000L)
    val hours = elapsed / (60L * 60L * 1000L)
    val days = elapsed / (24L * 60L * 60L * 1000L)
    return when {
        minutes < 1L -> "just now"
        minutes < 60L -> "${minutes} min ago"
        hours < 24L -> if (hours == 1L) "1 hour ago" else "${hours} hours ago"
        else -> if (days == 1L) "1 day ago" else "${days} days ago"
    }
}

fun formatScrapeValidity(timestamp: Long): String {
    val remaining = timestamp - System.currentTimeMillis()
    if (remaining <= 0L) return "Expired"
    val hours = remaining / (60L * 60L * 1000L)
    val minutes = (remaining % (60L * 60L * 1000L)) / (60L * 1000L)
    return if (hours >= 1L) "valid ${hours}h ${minutes}m" else "valid ${minutes.coerceAtLeast(1L)}m"
}

private fun String.toDisplayLabel(): String =
    lowercase(Locale.US)
        .replace("_", " ")
        .replaceFirstChar { char -> if (char.isLowerCase()) char.titlecase(Locale.US) else char.toString() }

private fun parseColor(value: String, fallback: Color): Color =
    runCatching { Color(value.toColorInt()) }.getOrDefault(fallback)

fun categoryIcon(id: String): ImageVector = when (id) {
    "electronics" -> Icons.Outlined.Devices
    "fashion" -> Icons.Outlined.Checkroom
    "mobile" -> Icons.Outlined.PhoneAndroid
    "beauty" -> Icons.Outlined.Spa
    "grocery" -> Icons.Outlined.LocalGroceryStore
    "home" -> Icons.Outlined.Home
    "samples" -> Icons.Outlined.CardGiftcard
    "coupons" -> Icons.Outlined.ConfirmationNumber
    "recharge" -> Icons.Outlined.Bolt
    "bank" -> Icons.Outlined.AccountBalance
    "student" -> Icons.Outlined.School
    "festival" -> Icons.Outlined.Celebration
    "travel" -> Icons.Outlined.TravelExplore
    "food" -> Icons.Outlined.Restaurant
    else -> Icons.Outlined.ShoppingBag
}
