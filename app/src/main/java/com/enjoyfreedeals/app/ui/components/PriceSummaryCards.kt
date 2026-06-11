package com.enjoyfreedeals.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.PriceStatsModel
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.GreyText
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.theme.SoftGreen
import com.enjoyfreedeals.app.theme.SoftYellow

@Composable
fun PriceSummaryCards(
    stats: PriceStatsModel,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        PriceSummaryCard(
            title = "Average Price",
            price = stats.averagePrice,
            icon = Icons.Outlined.BarChart,
            accent = AccentYellow,
            background = SoftYellow.copy(alpha = 0.52f)
        )
        PriceSummaryCard(
            title = "Lowest Price",
            price = stats.lowestPrice,
            icon = Icons.Outlined.ArrowDownward,
            accent = PrimaryGreen,
            background = SoftGreen.copy(alpha = 0.64f)
        )
        PriceSummaryCard(
            title = "Highest Price",
            price = stats.highestPrice,
            icon = Icons.Outlined.ArrowUpward,
            accent = PrimaryRed,
            background = PrimaryRed.copy(alpha = 0.08f)
        )
    }
}

@Composable
private fun PriceSummaryCard(
    title: String,
    price: Double,
    icon: ImageVector,
    accent: Color,
    background: Color
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = background,
        border = BorderStroke(1.dp, accent.copy(alpha = 0.22f))
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(icon, contentDescription = null, tint = accent)
            Text(title, color = GreyText, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
            Text(formatPrice(price), color = accent, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
        }
    }
}
