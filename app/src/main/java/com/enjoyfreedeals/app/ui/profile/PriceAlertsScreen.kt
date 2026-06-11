package com.enjoyfreedeals.app.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PriceAlertModel
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.ProfileDealCard
import com.enjoyfreedeals.app.ui.components.SectionTitle
import com.enjoyfreedeals.app.ui.components.formatPrice

@Composable
fun PriceAlertsScreen(
    alerts: List<PriceAlertModel>,
    isLoading: Boolean,
    onViewDeal: (DealModel) -> Unit,
    onOpenDealDetails: (DealModel) -> Unit,
    onRemovePriceAlert: (PriceAlertModel) -> Unit,
    onUpdateTargetPrice: (PriceAlertModel, Double) -> Unit
) {
    var editingAlert by remember { mutableStateOf<PriceAlertModel?>(null) }

    PremiumBackground {
        LazyColumn(contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item { SectionTitle("Price Alerts", subtitle = "Products you are tracking for price drops") }
            when {
                isLoading -> item { EmptyState("Loading price alerts.", "Fetching your active and triggered alerts.") }
                alerts.isEmpty() -> item { EmptyState("No price alerts set.", "Open a deal and set your target price.") }
                else -> items(alerts, key = { it.id.ifBlank { it.dealId } }) { alert ->
                    val deal = alert.toDealModel()
                    val status = buildString {
                        append("Current: ${formatPrice(alert.currentPrice)}")
                        append("  |  Target: ${formatPrice(alert.targetPrice)}")
                        append("  |  ")
                        append(if (alert.isActive) "Active" else "Inactive")
                        append("  |  ")
                        append(if (alert.isTriggered) "Triggered" else "Not triggered")
                    }
                    ProfileDealCard(
                        imageUrl = alert.imageUrl,
                        title = alert.productTitle,
                        platform = alert.platform,
                        price = alert.currentPrice,
                        originalPrice = alert.originalPrice,
                        metaText = alert.createdAt?.let { "Created: $it" },
                        statusText = status,
                        onViewDetails = { onOpenDealDetails(deal) },
                        onViewDeal = { onViewDeal(deal) },
                        onEditTarget = { editingAlert = alert },
                        onRemove = { onRemovePriceAlert(alert) }
                    )
                }
            }
        }
    }

    editingAlert?.let { alert ->
        var targetText by remember(alert.id, alert.targetPrice) {
            mutableStateOf(alert.targetPrice.toInt().toString())
        }
        AlertDialog(
            onDismissRequest = { editingAlert = null },
            title = { Text("Edit Target Price") },
            text = {
                OutlinedTextField(
                    value = targetText,
                    onValueChange = { targetText = it.filter { char -> char.isDigit() || char == '.' } },
                    label = { Text("Target price") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        targetText.toDoubleOrNull()?.let { onUpdateTargetPrice(alert, it) }
                        editingAlert = null
                    }
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { editingAlert = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}
