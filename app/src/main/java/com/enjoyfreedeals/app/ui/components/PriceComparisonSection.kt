package com.enjoyfreedeals.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.theme.GreyText

@Composable
fun PriceComparisonSection(
    prices: List<StorePriceModel>,
    lastCheckedAt: Long?,
    onStoreClick: (StorePriceModel) -> Unit,
    modifier: Modifier = Modifier
) {
    if (prices.isEmpty()) return
    var showAll by remember(prices) { mutableStateOf(false) }
    val normalizedPrices = prices.markLowestPrice()
    val lowest = normalizedPrices.firstOrNull { it.isLowestPrice }
    val visiblePrices = if (showAll) normalizedPrices else normalizedPrices.take(5)
    val hiddenCount = (normalizedPrices.size - visiblePrices.size).coerceAtLeast(0)

    ElevatedCard(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Column {
                Text("Price Comparison", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge)
                Text(
                    lastCheckedAt?.let { "Updated ${formatDate(it)}" } ?: "Updated recently",
                    color = GreyText,
                    style = MaterialTheme.typography.labelMedium
                )
            }
            lowest?.let {
                LowestPriceCard(
                    platform = it.platform,
                    price = it.price,
                    count = normalizedPrices.size
                )
            }
            visiblePrices.forEach { price ->
                PlatformPriceRow(price = price, onClick = { onStoreClick(price) })
            }
            if (hiddenCount > 0) {
                Button(modifier = Modifier.fillMaxWidth(), onClick = { showAll = true }) {
                    Text("Show More Platforms ($hiddenCount)")
                }
            }
        }
    }
}

private fun List<StorePriceModel>.markLowestPrice(): List<StorePriceModel> {
    val lowest = filter { it.available && it.price > 0.0 }.minByOrNull { it.price }
    return map { price ->
        price.copy(isLowestPrice = lowest != null && price.platform == lowest.platform && price.price == lowest.price)
    }.sortedWith(compareBy<StorePriceModel> { !it.available }.thenBy { it.price })
}
