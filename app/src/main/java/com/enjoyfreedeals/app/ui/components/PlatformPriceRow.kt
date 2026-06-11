package com.enjoyfreedeals.app.ui.components

import android.util.Log
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.OpenInNew
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Button
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.theme.GreyText
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.theme.SoftGreen
import com.enjoyfreedeals.app.utils.buildPlatformSearchUrl
import com.enjoyfreedeals.app.utils.isActualDealUrl

@Composable
fun PlatformPriceRow(
    price: StorePriceModel,
    productTitle: String,
    onOpenUrl: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val hasActualDealLink = price.available && isActualDealUrl(price.redirectUrl)
    val targetUrl = if (hasActualDealLink) price.redirectUrl else buildPlatformSearchUrl(price.platform, productTitle)
    val buttonText = if (hasActualDealLink) "View Deal" else "Search on ${price.platform.ifBlank { "Platform" }}"
    val cardShape = RoundedCornerShape(18.dp)
    ElevatedCard(
        modifier = modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = if (price.isLowestPrice) PrimaryGreen.copy(alpha = 0.34f) else GreyText.copy(alpha = 0.12f),
                shape = cardShape
            ),
        shape = cardShape,
        colors = CardDefaults.elevatedCardColors(
            containerColor = if (price.isLowestPrice) SoftGreen.copy(alpha = 0.84f) else MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = if (price.isLowestPrice) 4.dp else 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                AsyncImage(
                    model = price.storeLogoUrl.ifBlank { null },
                    contentDescription = price.platform,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.size(44.dp)
                )

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(top = 2.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = price.platform.ifBlank { "Store" },
                            modifier = Modifier.weight(1f, fill = false),
                            fontWeight = FontWeight.Black,
                            style = MaterialTheme.typography.titleSmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (price.isLowestPrice) BestPriceBadge()
                    }
                    Text(
                        text = if (price.available) price.deliveryInfo.ifBlank { "Delivery info unavailable" } else "Not available",
                        color = GreyText,
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (price.couponCode.isNotBlank()) {
                        Text(
                            text = "Coupon: ${price.couponCode}",
                            color = PrimaryRed,
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.labelSmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Column(
                    modifier = Modifier.width(112.dp),
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Text(
                        text = if (price.available) formatPrice(price.price) else "N/A",
                        color = PrimaryGreen,
                        fontWeight = FontWeight.Black,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    price.originalPrice?.takeIf { it > price.price }?.let {
                        Text(
                            text = formatPrice(it),
                            color = GreyText,
                            textDecoration = TextDecoration.LineThrough,
                            style = MaterialTheme.typography.labelSmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    price.discountPercent?.takeIf { it > 0.0 }?.let {
                        Text(
                            text = "${it.toInt()}% OFF",
                            color = PrimaryGreen,
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.labelSmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            if (hasActualDealLink) {
                Button(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = {
                        Log.d("PriceComparison", "Opening comparison product URL: $targetUrl")
                        onOpenUrl(targetUrl)
                    },
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Outlined.OpenInNew, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(buttonText, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            } else {
                OutlinedButton(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = {
                        Log.d("PriceComparison", "Opening platform search URL: $targetUrl")
                        onOpenUrl(targetUrl)
                    },
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Outlined.Search, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(buttonText, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}
