package com.enjoyfreedeals.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.BuyScoreModel
import com.enjoyfreedeals.app.utils.BuyScoreCalculator
import com.enjoyfreedeals.app.viewmodel.BuyScoreRange
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

private val GaugeRed = Color(0xFFFF3B6B)
private val GaugeOrange = Color(0xFFFF9800)
private val GaugeYellow = Color(0xFFFFC107)
private val GaugeGreen = Color(0xFF14B87A)
private val TabPurple = Color(0xFF6D28D9)
private val LightGrey = Color(0xFFF4F6FA)
private val DarkTitle = Color(0xFF1E293B)
private val MutedGrey = Color(0xFF94A3B8)

@Composable
fun BuyScoreCard(
    buyScoreModel: BuyScoreModel,
    selectedRange: BuyScoreRange,
    onRangeSelected: (BuyScoreRange) -> Unit,
    modifier: Modifier = Modifier
) {
    val selectedScore = when (selectedRange) {
        BuyScoreRange.RIGHT_NOW -> buyScoreModel.currentScore
        BuyScoreRange.IN_15_DAYS -> buyScoreModel.scoreIn15Days
        BuyScoreRange.IN_30_DAYS -> buyScoreModel.scoreIn30Days
    }.coerceIn(0, 100)
    val animatedScore by animateIntAsState(
        targetValue = selectedScore,
        animationSpec = tween(650),
        label = "buy-score-number"
    )
    val title = BuyScoreCalculator.recommendationTitle(animatedScore)
    val subtitle = BuyScoreCalculator.recommendationSubtitle(animatedScore)
    val titleColor = when {
        animatedScore >= 70 -> GaugeGreen
        animatedScore >= 50 -> GaugeOrange
        else -> GaugeRed
    }

    ElevatedCard(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                text = "Good time to buy?",
                color = MaterialTheme.colorScheme.onSurface,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            BuyScoreGauge(score = selectedScore, animatedScore = animatedScore)
            Text(
                text = title,
                color = titleColor,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
                textAlign = TextAlign.Center
            )
            Text(
                text = subtitle,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.fillMaxWidth()
            )
            BuyScoreTabs(selectedRange = selectedRange, onRangeSelected = onRangeSelected)
        }
    }
}

@Composable
fun BuyScoreGauge(
    score: Int,
    modifier: Modifier = Modifier,
    animatedScore: Int = score
) {
    val animatedPointer by animateFloatAsState(
        targetValue = score.coerceIn(0, 100).toFloat(),
        animationSpec = tween(650),
        label = "buy-score-pointer"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(168.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxWidth().height(150.dp)) {
            val strokePx = 18.dp.toPx()
            val radius = min(size.width / 2f - strokePx, size.height * 0.78f)
            val center = Offset(size.width / 2f, size.height * 0.92f)
            val arcSize = Size(radius * 2f, radius * 2f)
            val topLeft = Offset(center.x - radius, center.y - radius)
            val stroke = Stroke(width = strokePx, cap = StrokeCap.Round)

            drawArc(
                color = GaugeRed,
                startAngle = 180f,
                sweepAngle = 72f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = stroke
            )
            drawArc(
                brush = Brush.linearGradient(listOf(GaugeOrange, GaugeYellow)),
                startAngle = 252f,
                sweepAngle = 54f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = stroke
            )
            drawArc(
                color = GaugeGreen,
                startAngle = 306f,
                sweepAngle = 54f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = stroke
            )

            val angle = (180f + (animatedPointer / 100f) * 180f) * (PI.toFloat() / 180f)
            val pointer = Offset(
                x = center.x + radius * cos(angle),
                y = center.y + radius * sin(angle)
            )
            drawCircle(Color.Black.copy(alpha = 0.12f), radius = 15.dp.toPx(), center = pointer + Offset(0f, 3.dp.toPx()))
            drawCircle(GaugeOrange, radius = 14.dp.toPx(), center = pointer)
            drawCircle(Color.White, radius = 6.dp.toPx(), center = pointer)
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(top = 36.dp)) {
            Text(
                text = BuyScoreCalculator.scoreLabel(animatedScore.toDouble()),
                color = GaugeOrange,
                style = MaterialTheme.typography.displaySmall,
                fontWeight = FontWeight.Black
            )
            Text(
                text = "BUY SCORE",
                color = MutedGrey,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold
            )
        }
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Wait", color = MutedGrey, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
            Text("Buy", color = MutedGrey, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun BuyScoreTabs(
    selectedRange: BuyScoreRange,
    onRangeSelected: (BuyScoreRange) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(LightGrey, RoundedCornerShape(18.dp))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        BuyScoreRange.entries.forEach { range ->
            val selected = range == selectedRange
            val background by animateColorAsState(
                targetValue = if (selected) Color.White else Color.Transparent,
                animationSpec = tween(220),
                label = "buy-score-tab-bg"
            )
            val textColor by animateColorAsState(
                targetValue = if (selected) TabPurple else MutedGrey,
                animationSpec = tween(220),
                label = "buy-score-tab-text"
            )
            Surface(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onRangeSelected(range) },
                color = background,
                shape = RoundedCornerShape(14.dp)
            ) {
                Text(
                    text = range.label,
                    color = textColor,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Black,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(vertical = 10.dp)
                )
            }
        }
    }
}
