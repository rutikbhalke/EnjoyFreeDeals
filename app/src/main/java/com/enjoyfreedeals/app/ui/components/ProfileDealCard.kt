package com.enjoyfreedeals.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.LocalOffer
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.enjoyfreedeals.app.R
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.DarkText
import com.enjoyfreedeals.app.theme.GreyText
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed

@Composable
fun ProfileDealCard(
    imageUrl: String,
    title: String,
    platform: String,
    price: Double,
    originalPrice: Double? = null,
    discountPercent: Double? = null,
    metaText: String? = null,
    statusText: String? = null,
    onViewDetails: () -> Unit,
    onViewDeal: (() -> Unit)? = null,
    onRemove: (() -> Unit)? = null,
    onEditTarget: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AsyncImage(
                    model = imageUrl,
                    contentDescription = title,
                    modifier = Modifier.size(86.dp),
                    contentScale = ContentScale.Fit,
                    placeholder = painterResource(R.drawable.enjoyfreedeals_logo),
                    error = painterResource(R.drawable.enjoyfreedeals_logo)
                )
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text(title.ifBlank { "Untitled deal" }, fontWeight = FontWeight.Black, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    Text(platform.ifBlank { "Store" }, color = PrimaryGreen, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(formatPrice(price), color = PrimaryGreen, fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleMedium)
                        originalPrice?.takeIf { it > price && it > 0.0 }?.let {
                            Spacer(Modifier.width(8.dp))
                            Text(formatPrice(it), color = GreyText, textDecoration = TextDecoration.LineThrough, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                    discountPercent?.takeIf { it > 0.0 }?.let {
                        Surface(color = AccentYellow, contentColor = DarkText, shape = RoundedCornerShape(50)) {
                            Text("${it.toInt()}% OFF", Modifier.padding(horizontal = 9.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
            metaText?.takeIf { it.isNotBlank() }?.let {
                Text(it, color = GreyText, style = MaterialTheme.typography.bodySmall)
            }
            statusText?.takeIf { it.isNotBlank() }?.let {
                Surface(
                    color = PrimaryGreen.copy(alpha = 0.12f),
                    contentColor = PrimaryGreen,
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, PrimaryGreen.copy(alpha = 0.18f))
                ) {
                    Text(it, Modifier.padding(horizontal = 10.dp, vertical = 7.dp), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(onClick = onViewDetails, modifier = Modifier.weight(1f), shape = RoundedCornerShape(15.dp)) {
                    Text("View Details", fontWeight = FontWeight.Bold, maxLines = 1)
                }
                if (onViewDeal != null) {
                    Button(
                        onClick = onViewDeal,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                        shape = RoundedCornerShape(15.dp)
                    ) {
                        Icon(Icons.Outlined.LocalOffer, contentDescription = null, modifier = Modifier.size(17.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("View Deal", fontWeight = FontWeight.Bold, maxLines = 1)
                    }
                }
            }
            if (onEditTarget != null || onRemove != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    if (onEditTarget != null) {
                        OutlinedButton(onClick = onEditTarget, modifier = Modifier.weight(1f), shape = RoundedCornerShape(15.dp)) {
                            Icon(Icons.Outlined.Edit, contentDescription = null, modifier = Modifier.size(17.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Edit Target", fontWeight = FontWeight.Bold)
                        }
                    }
                    if (onRemove != null) {
                        OutlinedButton(onClick = onRemove, modifier = Modifier.weight(1f), shape = RoundedCornerShape(15.dp)) {
                            Icon(Icons.Outlined.Delete, contentDescription = null, tint = PrimaryRed, modifier = Modifier.size(17.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Remove", color = PrimaryRed, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            Spacer(Modifier.height(2.dp))
        }
    }
}
