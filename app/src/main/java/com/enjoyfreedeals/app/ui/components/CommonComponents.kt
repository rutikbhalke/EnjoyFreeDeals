package com.enjoyfreedeals.app.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CardGiftcard
import androidx.compose.material.icons.outlined.Celebration
import androidx.compose.material.icons.outlined.Checkroom
import androidx.compose.material.icons.outlined.ConfirmationNumber
import androidx.compose.material.icons.outlined.Devices
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.ImageNotSupported
import androidx.compose.material.icons.outlined.LocalGroceryStore
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.PhoneAndroid
import androidx.compose.material.icons.outlined.Restaurant
import androidx.compose.material.icons.outlined.School
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material.icons.outlined.Spa
import androidx.compose.material.icons.outlined.TravelExplore
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.compose.SubcomposeAsyncImage
import com.enjoyfreedeals.app.R
import com.enjoyfreedeals.app.data.model.BlogModel
import com.enjoyfreedeals.app.data.model.CategoryModel
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.CardWhite
import com.enjoyfreedeals.app.theme.DarkText
import com.enjoyfreedeals.app.theme.GreyText
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.theme.SoftGreen
import com.enjoyfreedeals.app.theme.SoftRed
import com.enjoyfreedeals.app.theme.SoftYellow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun PremiumBackground(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.background,
                        SoftGreen.copy(alpha = 0.55f),
                        SoftYellow.copy(alpha = 0.45f)
                    )
                )
            )
    ) {
        BackgroundBubble(Modifier.align(Alignment.TopStart).padding(top = 42.dp).size(190.dp), PrimaryRed.copy(alpha = 0.09f))
        BackgroundBubble(Modifier.align(Alignment.BottomEnd).padding(bottom = 80.dp).size(230.dp), PrimaryGreen.copy(alpha = 0.12f))
        content()
    }
}

@Composable
private fun BackgroundBubble(modifier: Modifier, color: Color) {
    val transition = rememberInfiniteTransition(label = "bubble")
    val scale by transition.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(tween(2600), RepeatMode.Reverse),
        label = "bubble-scale"
    )
    Box(
        modifier = modifier
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .clip(CircleShape)
            .background(color)
    )
}

@Composable
fun SparkleCanvas(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "sparkles")
    val progress by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1700), RepeatMode.Restart),
        label = "sparkle-progress"
    )
    Canvas(modifier = modifier) {
        val points = listOf(
            Offset(size.width * 0.18f, size.height * 0.22f) to AccentYellow,
            Offset(size.width * 0.82f, size.height * 0.24f) to PrimaryRed,
            Offset(size.width * 0.24f, size.height * 0.72f) to PrimaryGreen,
            Offset(size.width * 0.74f, size.height * 0.68f) to AccentYellow
        )
        points.forEachIndexed { index, item ->
            val pulse = ((progress + index * 0.18f) % 1f)
            drawCircle(item.second.copy(alpha = 0.45f * (1f - pulse)), radius = 5.dp.toPx() + pulse * 14.dp.toPx(), center = item.first)
            drawCircle(Color.White.copy(alpha = 0.92f), radius = 2.4.dp.toPx(), center = item.first)
        }
    }
}

@Composable
fun AppLogo(modifier: Modifier = Modifier, compact: Boolean = false) {
    Image(
        painter = painterResource(R.drawable.enjoyfreedeals_logo),
        contentDescription = "EnjoyFreeDeals logo",
        modifier = modifier
            .fillMaxWidth(if (compact) 0.58f else 0.86f)
            .height(if (compact) 48.dp else 90.dp),
        contentScale = ContentScale.Fit
    )
}

@Composable
fun SectionTitle(title: String, subtitle: String? = null, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
        if (!subtitle.isNullOrBlank()) {
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun DealSearchBox(value: String, onValueChange: (String) -> Unit, modifier: Modifier = Modifier) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier
            .fillMaxWidth()
            .shadow(8.dp, RoundedCornerShape(22.dp))
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(22.dp)),
        leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null, tint = PrimaryGreen) },
        placeholder = { Text("Search deals, stores, coupons...") },
        shape = RoundedCornerShape(22.dp),
        singleLine = true,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = PrimaryGreen,
            unfocusedBorderColor = Color.Transparent,
            focusedContainerColor = MaterialTheme.colorScheme.surface,
            unfocusedContainerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun FilterRow(options: List<String>, selected: String, onSelected: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        options.forEach { option ->
            FilterChip(
                selected = selected == option,
                onClick = { onSelected(option) },
                label = { Text(option, maxLines = 1) }
            )
        }
    }
}

@Composable
fun DealCard(
    deal: DealModel,
    isSaved: Boolean,
    onViewDeal: (DealModel) -> Unit,
    onSaveDeal: (DealModel) -> Unit,
    onShareDeal: (DealModel) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 5.dp)
    ) {
        Column {
            Box {
                SubcomposeAsyncImage(
                    model = deal.productImage,
                    contentDescription = deal.title,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(172.dp),
                    contentScale = ContentScale.Crop,
                    error = {
                        Box(Modifier.fillMaxSize().background(SoftGreen), contentAlignment = Alignment.Center) {
                            Icon(Icons.Outlined.ImageNotSupported, contentDescription = null, tint = PrimaryGreen)
                        }
                    },
                    loading = { ShimmerBlock(Modifier.fillMaxSize()) }
                )
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    BadgeText("${deal.discountPercent}% OFF", AccentYellow, DarkText)
                    if (deal.isHotDeal) BadgeText("HOT", PrimaryRed, Color.White)
                    if (deal.isFreeDeal) BadgeText("FREE", PrimaryGreen, Color.White)
                    if (deal.expiryDate - System.currentTimeMillis() < 2L * 24L * 60L * 60L * 1000L) {
                        BadgeText("LIMITED", Color(0xFF1E1E1E), Color.White)
                    }
                }
            }
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StorePill(deal.storeName)
                    Spacer(Modifier.width(8.dp))
                    Text(deal.categoryName, style = MaterialTheme.typography.labelMedium, color = GreyText)
                }
                Spacer(Modifier.height(8.dp))
                Text(deal.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(deal.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(10.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(formatPrice(deal.effectivePrice), color = PrimaryGreen, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                    Spacer(Modifier.width(8.dp))
                    Text(formatPrice(deal.originalPrice), color = GreyText, textDecoration = TextDecoration.LineThrough)
                    if (deal.couponCode.isNotBlank()) {
                        Spacer(Modifier.width(8.dp))
                        BadgeText(deal.couponCode, SoftYellow, DarkText)
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Button(
                        onClick = { onViewDeal(deal) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Icon(Icons.Outlined.LocalOffer, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("View Deal", fontWeight = FontWeight.Bold)
                    }
                    IconButton(onClick = { onSaveDeal(deal) }) {
                        Icon(if (isSaved) Icons.Outlined.Favorite else Icons.Outlined.FavoriteBorder, contentDescription = "Save deal", tint = if (isSaved) PrimaryRed else GreyText)
                    }
                    IconButton(onClick = { onShareDeal(deal) }) {
                        Icon(Icons.Outlined.Share, contentDescription = "Share deal", tint = PrimaryGreen)
                    }
                }
            }
        }
    }
}

@Composable
fun CategoryCard(category: CategoryModel, onClick: (CategoryModel) -> Unit, modifier: Modifier = Modifier) {
    val scale by animateFloatAsState(targetValue = 1f, animationSpec = tween(450), label = "category-scale")
    val color1 = parseColor(category.gradientColor1, PrimaryRed)
    val color2 = parseColor(category.gradientColor2, PrimaryGreen)
    Card(
        modifier = modifier
            .height(154.dp)
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .clickable { onClick(category) },
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 5.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.linearGradient(listOf(color1.copy(alpha = 0.88f), color2.copy(alpha = 0.88f))))
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Surface(color = Color.White.copy(alpha = 0.22f), shape = RoundedCornerShape(16.dp)) {
                Icon(categoryIcon(category.categoryId), contentDescription = null, tint = Color.White, modifier = Modifier.padding(10.dp))
            }
            Column {
                Text(category.categoryName, color = Color.White, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("${category.dealCount} deals", color = Color.White.copy(alpha = 0.9f), style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
fun BlogCard(blog: BlogModel, onReadMore: (BlogModel) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column {
            AsyncImage(blog.image, contentDescription = blog.title, modifier = Modifier.fillMaxWidth().height(155.dp), contentScale = ContentScale.Crop)
            Column(Modifier.padding(16.dp)) {
                Text(blog.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                Text(blog.shortDescription, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                    Text("${blog.author} • ${formatDate(blog.createdAt)}", style = MaterialTheme.typography.labelMedium, color = GreyText)
                    Button(onClick = { onReadMore(blog) }, colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed), shape = RoundedCornerShape(14.dp)) {
                        Text("Read More", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun EmptyState(title: String, subtitle: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Outlined.ShoppingBag, contentDescription = null, tint = PrimaryGreen, modifier = Modifier.size(42.dp))
            Spacer(Modifier.height(10.dp))
            Text(title, fontWeight = FontWeight.Black)
            Text(subtitle, color = GreyText, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun ShimmerBlock(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val alpha by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(tween(900), RepeatMode.Reverse),
        label = "shimmer-alpha"
    )
    Box(modifier.background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = alpha)))
}

@Composable
private fun BadgeText(text: String, background: Color, content: Color) {
    Surface(color = background, contentColor = content, shape = RoundedCornerShape(50)) {
        Text(text, modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun StorePill(storeName: String) {
    Surface(
        color = SoftGreen,
        contentColor = PrimaryGreen,
        shape = RoundedCornerShape(50),
        border = BorderStroke(1.dp, PrimaryGreen.copy(alpha = 0.14f))
    ) {
        Text(storeName, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp), style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
    }
}

fun formatPrice(price: Double): String =
    if (price <= 0.0) "Free" else "Rs.${String.format(Locale.US, "%,.0f", price)}"

fun formatDate(timestamp: Long): String =
    SimpleDateFormat("dd MMM yyyy", Locale.US).format(Date(timestamp))

private fun parseColor(value: String, fallback: Color): Color =
    runCatching { Color(android.graphics.Color.parseColor(value)) }.getOrDefault(fallback)

fun categoryIcon(id: String): ImageVector = when (id) {
    "electronics" -> Icons.Outlined.Devices
    "fashion" -> Icons.Outlined.Checkroom
    "mobile" -> Icons.Outlined.PhoneAndroid
    "beauty" -> Icons.Outlined.Spa
    "grocery" -> Icons.Outlined.LocalGroceryStore
    "home" -> Icons.Outlined.Home
    "samples" -> Icons.Outlined.CardGiftcard
    "coupons" -> Icons.Outlined.ConfirmationNumber
    "recharge" -> Icons.Outlined.Bolt
    "bank" -> Icons.Outlined.AccountBalance
    "student" -> Icons.Outlined.School
    "festival" -> Icons.Outlined.Celebration
    "travel" -> Icons.Outlined.TravelExplore
    "food" -> Icons.Outlined.Restaurant
    else -> Icons.Outlined.ShoppingBag
}

