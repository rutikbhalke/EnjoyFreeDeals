package com.enjoyfreedeals.app.ui.deals

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.TrendingDown
import androidx.compose.material.icons.outlined.AccessTime
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.Storefront
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.DarkText
import com.enjoyfreedeals.app.theme.GreyText
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.theme.SoftGreen
import com.enjoyfreedeals.app.theme.SoftRed
import com.enjoyfreedeals.app.theme.SoftYellow
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.FilterRow
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.formatDate
import com.enjoyfreedeals.app.ui.components.formatPrice
import kotlin.math.abs

private const val DAY_MS = 24L * 60L * 60L * 1000L

private val graphRanges = listOf("7 Days", "30 Days", "3 Months", "6 Months", "1 Year", "All Time")

@Composable
fun ProductPriceHistoryScreen(
    deal: DealModel?,
    history: List<PricePointModel>,
    isAlertEnabled: Boolean,
    onSetPriceAlert: (DealModel) -> Unit,
    onViewDeal: (DealModel) -> Unit
) {
    PremiumBackground {
        if (deal == null) {
            Box(Modifier.padding(18.dp)) {
                EmptyState("No product selected.", "Open any deal to view its price history.")
            }
            return@PremiumBackground
        }

        val effectiveHistory = history.ifEmpty {
            listOf(DealRepository.buildPriceHistoryRecord(deal, emptyList(), deal.priceCheckedAt))
        }
        val stats = DealRepository.calculatePriceStats(deal, effectiveHistory)
        val lastUpdated = effectiveHistory.lastOrNull()?.recordedAt ?: deal.priceCheckedAt
        var selectedRange by remember { mutableStateOf("30 Days") }
        val filteredHistory = remember(effectiveHistory, selectedRange) {
            filterHistoryByRange(effectiveHistory, selectedRange)
        }

        LazyColumn(
            contentPadding = PaddingValues(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                ProductHeroCard(deal = deal, currentPrice = stats.currentPrice)
            }
            item {
                PriceMetricsGrid(
                    lowestPrice = stats.lowestPrice,
                    highestPrice = stats.highestPrice,
                    averagePrice = stats.averagePrice,
                    lastUpdated = lastUpdated
                )
            }
            item {
                BubbleGraphCard(
                    deal = deal,
                    history = filteredHistory,
                    selectedRange = selectedRange,
                    onRangeSelected = { selectedRange = it }
                )
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(
                        onClick = { onSetPriceAlert(deal) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(18.dp),
                        border = BorderStroke(1.dp, if (isAlertEnabled) PrimaryRed else PrimaryGreen)
                    ) {
                        Icon(Icons.Outlined.NotificationsActive, contentDescription = null, modifier = Modifier.size(18.dp), tint = if (isAlertEnabled) PrimaryRed else PrimaryGreen)
                        Spacer(Modifier.size(8.dp))
                        Text(if (isAlertEnabled) "Alert Set" else "Set Alert", fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = { onViewDeal(deal) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                        shape = RoundedCornerShape(18.dp)
                    ) {
                        Icon(Icons.Outlined.LocalOffer, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.size(8.dp))
                        Text(if (deal.couponCode.isNotBlank()) "Get Coupon" else "View Deal", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ProductHeroCard(deal: DealModel, currentPrice: Double) {
    Card(
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column {
            AsyncImage(
                model = deal.productImage,
                contentDescription = deal.title,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp)
                    .clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)),
                contentScale = ContentScale.Crop
            )
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Outlined.Storefront, contentDescription = null, tint = PrimaryGreen, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(6.dp))
                    Text(deal.storeName, color = PrimaryGreen, fontWeight = FontWeight.Bold)
                }
                Text(deal.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(formatPrice(currentPrice), color = PrimaryGreen, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                    Spacer(Modifier.size(10.dp))
                    Text(formatPrice(deal.originalPrice), color = GreyText, textDecoration = TextDecoration.LineThrough)
                    Spacer(Modifier.size(8.dp))
                    Badge("${deal.discountPercent}% OFF", AccentYellow, DarkText)
                }
            }
        }
    }
}

@Composable
private fun PriceMetricsGrid(
    lowestPrice: Double,
    highestPrice: Double,
    averagePrice: Double,
    lastUpdated: Long
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard("Lowest Ever", formatPrice(lowestPrice), SoftGreen, PrimaryGreen, Modifier.weight(1f))
            MetricCard("Highest Ever", formatPrice(highestPrice), SoftRed, PrimaryRed, Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard("Average", formatPrice(averagePrice), SoftYellow, DarkText, Modifier.weight(1f))
            MetricCard("Last Updated", formatDate(lastUpdated), MaterialTheme.colorScheme.surface, DarkText, Modifier.weight(1f))
        }
    }
}

@Composable
private fun BubbleGraphCard(
    deal: DealModel,
    history: List<PricePointModel>,
    selectedRange: String,
    onRangeSelected: (String) -> Unit
) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.AutoMirrored.Outlined.TrendingDown, contentDescription = null, tint = PrimaryGreen)
                Spacer(Modifier.size(8.dp))
                Column {
                    Text("Bubble Price History", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleMedium)
                    Text("Bubble size shows discount or price drop", color = GreyText, style = MaterialTheme.typography.labelMedium)
                }
            }
            FilterRow(graphRanges, selectedRange, onRangeSelected)
            BubblePriceHistoryGraph(
                history = history,
                storeName = deal.storeName,
                modifier = Modifier.fillMaxWidth().height(250.dp)
            )
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(history.firstOrNull()?.let { formatDate(it.recordedAt) }.orEmpty(), color = GreyText, style = MaterialTheme.typography.labelMedium)
                Text(history.lastOrNull()?.let { formatDate(it.recordedAt) }.orEmpty(), color = GreyText, style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}

@Composable
private fun BubblePriceHistoryGraph(
    history: List<PricePointModel>,
    storeName: String,
    modifier: Modifier = Modifier
) {
    var started by remember { mutableStateOf(false) }
    var selectedPoint by remember(history) { mutableStateOf<PricePointModel?>(null) }
    val progress by animateFloatAsState(
        targetValue = if (started) 1f else 0f,
        animationSpec = tween(700),
        label = "bubble-graph-progress"
    )

    LaunchedEffect(history) {
        started = true
    }

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Canvas(
            modifier = modifier
                .clip(RoundedCornerShape(20.dp))
                .background(Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.84f), SoftGreen.copy(alpha = 0.48f))))
                .border(1.dp, PrimaryGreen.copy(alpha = 0.12f), RoundedCornerShape(20.dp))
                .pointerInput(history) {
                    detectTapGestures { tap ->
                        val nodes = buildBubbleNodes(history, size.width.toFloat(), size.height.toFloat())
                        selectedPoint = nodes.minByOrNull { abs(distance(tap, it.center) - it.radius) }
                            ?.takeIf { distance(tap, it.center) <= it.radius + 14f }
                            ?.point
                    }
                }
                .padding(10.dp)
        ) {
            val nodes = buildBubbleNodes(history, size.width, size.height)
            val axisColor = GreyText.copy(alpha = 0.18f)
            val axisStart = Offset(34f, 18f)
            val axisBottom = Offset(34f, size.height - 28f)
            val axisEnd = Offset(size.width - 18f, size.height - 28f)

            drawLine(axisColor, axisStart, axisBottom, strokeWidth = 1.dp.toPx())
            drawLine(axisColor, axisBottom, axisEnd, strokeWidth = 1.dp.toPx())

            nodes.zipWithNext().forEach { (first, second) ->
                drawLine(
                    color = PrimaryGreen.copy(alpha = 0.26f),
                    start = first.center,
                    end = second.center,
                    strokeWidth = 2.dp.toPx()
                )
            }

            nodes.forEach { node ->
                val animatedRadius = node.radius * progress
                drawCircle(node.color.copy(alpha = 0.18f), radius = animatedRadius * 1.55f, center = node.center)
                drawCircle(node.color, radius = animatedRadius, center = node.center)
                drawCircle(Color.White.copy(alpha = 0.92f), radius = animatedRadius * 0.34f, center = node.center)
                if (selectedPoint?.id == node.point.id) {
                    drawCircle(
                        color = DarkText,
                        radius = animatedRadius + 3.dp.toPx(),
                        center = node.center,
                        style = Stroke(width = 2.dp.toPx())
                    )
                }
            }
        }

        selectedPoint?.let { point ->
            Surface(
                color = DarkText,
                contentColor = Color.White,
                shape = RoundedCornerShape(18.dp)
            ) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(formatDate(point.recordedAt), fontWeight = FontWeight.Black)
                    Text("Price: ${formatPrice(point.price)}")
                    Text("Discount: ${point.discountPercentage}%")
                    Text("Store: ${point.storeName.ifBlank { storeName }}")
                    Text("Drop: ${formatPrice(point.priceDropAmount)}")
                }
            }
        }
    }
}

@Composable
private fun MetricCard(label: String, value: String, background: Color, contentColor: Color, modifier: Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = background,
        border = BorderStroke(1.dp, PrimaryGreen.copy(alpha = 0.08f))
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(label, color = GreyText, style = MaterialTheme.typography.labelMedium)
            Text(value, color = contentColor, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun Badge(text: String, background: Color, contentColor: Color) {
    Surface(color = background, contentColor = contentColor, shape = RoundedCornerShape(50)) {
        Text(text, modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp), style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Black)
    }
}

private data class BubbleNode(
    val point: PricePointModel,
    val center: Offset,
    val radius: Float,
    val color: Color
)

private fun buildBubbleNodes(history: List<PricePointModel>, width: Float, height: Float): List<BubbleNode> {
    if (history.isEmpty()) return emptyList()
    val points = history.sortedBy { it.recordedAt }
    val prices = points.map { it.price }
    val minPrice = prices.minOrNull() ?: 0.0
    val maxPrice = prices.maxOrNull() ?: 0.0
    val range = (maxPrice - minPrice).takeIf { it > 0.0 } ?: 1.0
    val maxDrop = points.maxOfOrNull { it.priceDropAmount.coerceAtLeast(0.0) } ?: 0.0
    val padX = 38f
    val padTop = 20f
    val padBottom = 32f
    val graphWidth = (width - padX - 18f).coerceAtLeast(1f)
    val graphHeight = (height - padTop - padBottom).coerceAtLeast(1f)
    val step = if (points.size > 1) graphWidth / (points.size - 1) else graphWidth

    return points.mapIndexed { index, point ->
        val x = padX + step * index
        val normalized = ((point.price - minPrice) / range).toFloat()
        val y = padTop + graphHeight - normalized * graphHeight
        val intensity = maxOf(
            point.discountPercentage / 100f,
            if (maxDrop > 0.0) (point.priceDropAmount / maxDrop).toFloat() else 0f
        ).coerceIn(0.10f, 1f)
        val radius = 8f + intensity * 18f
        val color = when {
            index == points.lastIndex -> AccentYellow
            point.price == minPrice -> PrimaryGreen
            point.price == maxPrice -> PrimaryRed
            else -> Color(0xFF4E8DF5)
        }
        BubbleNode(point, Offset(x, y), radius, color)
    }
}

private fun filterHistoryByRange(history: List<PricePointModel>, range: String): List<PricePointModel> {
    val sorted = history.sortedBy { it.recordedAt }
    if (range == "All Time") return sorted
    val now = sorted.lastOrNull()?.recordedAt ?: System.currentTimeMillis()
    val days = when (range) {
        "7 Days" -> 7L
        "30 Days" -> 30L
        "3 Months" -> 90L
        "6 Months" -> 180L
        "1 Year" -> 365L
        else -> Long.MAX_VALUE
    }
    val cutoff = now - days * DAY_MS
    return sorted.filter { it.recordedAt >= cutoff }.ifEmpty { sorted.takeLast(1) }
}

private fun distance(first: Offset, second: Offset): Float {
    val dx = first.x - second.x
    val dy = first.y - second.y
    return kotlin.math.sqrt(dx * dx + dy * dy)
}
