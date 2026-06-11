package com.enjoyfreedeals.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.TrendingDown
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.theme.GreyText
import com.enjoyfreedeals.app.theme.PrimaryGreen

@Composable
fun PriceHistoryGraph(
    historyPoints: List<PricePointModel>,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.AutoMirrored.Outlined.TrendingDown,
                    contentDescription = null,
                    tint = PrimaryGreen,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(Modifier.size(8.dp))
                Column {
                    Text("Price History", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleMedium)
                    Text("Track this deal price over time", color = GreyText, style = MaterialTheme.typography.bodySmall)
                }
            }
            PriceGraph(
                history = historyPoints,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(190.dp)
            )
        }
    }
}
