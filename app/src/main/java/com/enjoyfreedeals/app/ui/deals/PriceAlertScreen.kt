package com.enjoyfreedeals.app.ui.deals

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
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.text.KeyboardOptions
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
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.formatPrice

@Composable
fun PriceAlertScreen(
    deal: DealModel?,
    history: List<PricePointModel>,
    currentTargetPrice: Double?,
    onSaveAlert: (DealModel, Double) -> Unit,
    onRemoveAlert: (DealModel) -> Unit,
    onViewDeal: (DealModel) -> Unit
) {
    PremiumBackground {
        if (deal == null) {
            Box(Modifier.padding(18.dp)) {
                EmptyState("No product selected.", "Open any deal to set a price alert.")
            }
            return@PremiumBackground
        }

        val effectiveHistory = history.ifEmpty {
            listOf(DealRepository.buildPriceHistoryRecord(deal, emptyList(), deal.priceCheckedAt))
        }
        val stats = DealRepository.calculatePriceStats(deal, effectiveHistory)
        val suggested = DealRepository.suggestedAlertPrice(deal, effectiveHistory)
        var targetText by remember(deal.dealId, currentTargetPrice) {
            mutableStateOf((currentTargetPrice ?: suggested).toInt().toString())
        }
        val target = targetText.toDoubleOrNull()

        LaunchedEffect(suggested) {
            if (targetText.isBlank()) targetText = suggested.toInt().toString()
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
                            model = deal.productImage,
                            contentDescription = deal.title,
                            modifier = Modifier.fillMaxWidth().height(210.dp),
                            contentScale = ContentScale.Crop
                        )
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text(deal.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            Text(deal.storeName, color = PrimaryGreen, fontWeight = FontWeight.Bold)
                            PriceLine("Current Price", formatPrice(stats.currentPrice))
                        }
                    }
                }
            }
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Set Price Alert", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge)
                        OutlinedTextField(
                            value = targetText,
                            onValueChange = { value ->
                                targetText = value.filter { it.isDigit() || it == '.' }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Enter target price") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                        Surface(color = SoftGreen, contentColor = DarkText, shape = RoundedCornerShape(18.dp)) {
                            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("Suggested alert price", color = GreyText, style = MaterialTheme.typography.labelMedium)
                                Text(formatPrice(suggested), color = PrimaryGreen, fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge)
                                Text("Based on 10% below current price, near lowest price, and below average price.", color = GreyText, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                            Button(
                                onClick = { target?.let { onSaveAlert(deal, it) } },
                                modifier = Modifier.weight(1f),
                                enabled = target != null && target >= 0.0,
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Icon(Icons.Outlined.NotificationsActive, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.size(8.dp))
                                Text("Save Alert", fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = { onRemoveAlert(deal) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Icon(Icons.Outlined.Delete, contentDescription = null, tint = PrimaryRed, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.size(8.dp))
                                Text("Remove", color = PrimaryRed, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
            item {
                Button(
                    onClick = { onViewDeal(deal) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = DarkText),
                    shape = RoundedCornerShape(18.dp)
                ) {
                    Icon(Icons.Outlined.LocalOffer, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(8.dp))
                    Text("View Deal", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun PriceLine(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = GreyText)
        Text(value, color = PrimaryGreen, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
    }
}
