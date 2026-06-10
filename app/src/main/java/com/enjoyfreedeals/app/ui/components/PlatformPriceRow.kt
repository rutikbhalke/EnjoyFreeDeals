package com.enjoyfreedeals.app.ui.components

import android.util.Log
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.enjoyfreedeals.app.data.model.StorePriceModel
import com.enjoyfreedeals.app.theme.GreyText
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.theme.SoftGreen

@Composable
fun PlatformPriceRow(
    price: StorePriceModel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val hasActualDealLink = price.available && isActualProductUrl(price.platform, price.redirectUrl)
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = if (price.isLowestPrice) PrimaryGreen.copy(alpha = 0.34f) else GreyText.copy(alpha = 0.12f),
                shape = RoundedCornerShape(18.dp)
            )
            .clickable(enabled = hasActualDealLink) {
                Log.d("PriceComparison", "Opening comparison product URL: ${price.redirectUrl}")
                onClick()
            },
        shape = RoundedCornerShape(18.dp),
        color = if (price.isLowestPrice) SoftGreen.copy(alpha = 0.84f) else MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = price.storeLogoUrl.ifBlank { null },
                contentDescription = price.platform,
                contentScale = ContentScale.Fit,
                modifier = Modifier.size(58.dp)
            )
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(price.platform, fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleSmall)
                    if (price.isLowestPrice) BestPriceBadge()
                }
                Text(
                    if (price.available) price.deliveryInfo else "Not available",
                    color = GreyText,
                    style = MaterialTheme.typography.labelSmall
                )
                if (price.couponCode.isNotBlank()) {
                    Text("Coupon: ${price.couponCode}", color = PrimaryRed, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
                }
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(if (price.available) formatPrice(price.price) else "N/A", color = PrimaryGreen, fontWeight = FontWeight.Black)
                price.originalPrice?.takeIf { it > price.price }?.let {
                    Text(
                        formatPrice(it),
                        color = GreyText,
                        textDecoration = TextDecoration.LineThrough,
                        style = MaterialTheme.typography.labelSmall
                    )
                }
                price.discountPercent?.takeIf { it > 0.0 }?.let {
                    Text("${it.toInt()}% OFF", color = PrimaryGreen, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
                }
                Button(
                    enabled = hasActualDealLink,
                    onClick = {
                        Log.d("PriceComparison", "Opening comparison product URL: ${price.redirectUrl}")
                        onClick()
                    },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(if (hasActualDealLink) "View" else "Actual deal link unavailable")
                }
            }
            Spacer(Modifier.width(12.dp))
        }
    }
}

private fun isActualProductUrl(platform: String, url: String): Boolean {
    if (!url.startsWith("http://", ignoreCase = true) && !url.startsWith("https://", ignoreCase = true)) return false
    val uri = runCatching { java.net.URI(url) }.getOrNull() ?: return false
    val host = uri.host.orEmpty().lowercase()
    val path = uri.path.orEmpty().lowercase()
    val key = platform.lowercase().replace(Regex("[^a-z0-9]+"), "")
    if (path.isBlank() || path == "/") return false
    return when (key) {
        "amazon" -> Regex("/(dp|gp/product)/[a-z0-9]{8,}", RegexOption.IGNORE_CASE).containsMatchIn(path)
        "flipkart" -> host.contains("flipkart.") && (path.contains("/p/") || path.contains("/itm"))
        "meesho" -> host.contains("meesho.") && path.contains("/p/")
        "myntra" -> host.contains("myntra.") && (path.contains("/buy") || path.contains("/product/"))
        "ajio", "croma", "nykaa" -> path.contains("/p/")
        "tatacliq" -> path.contains("/p-")
        else -> path.split("/").filter { it.isNotBlank() }.size >= 2
    }
}
