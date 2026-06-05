package com.enjoyfreedeals.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Policy
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.ToggleOff
import androidx.compose.material.icons.outlined.ToggleOn
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.viewmodel.ProfileUiState

@Composable
fun ProfileScreen(
    state: ProfileUiState,
    onNotificationToggle: (Boolean) -> Unit,
    onDarkModeToggle: (Boolean) -> Unit,
    onSavedDeals: () -> Unit,
    onSharedDeals: () -> Unit,
    onPriceAlerts: () -> Unit,
    onRecentlyViewed: () -> Unit,
    onSettings: () -> Unit,
    onLanguage: () -> Unit,
    onAbout: () -> Unit,
    onLogout: () -> Unit
) {
    val user = state.user
    PremiumBackground {
        LazyColumn(
            contentPadding = PaddingValues(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Card(shape = RoundedCornerShape(28.dp), colors = CardDefaults.cardColors(containerColor = Color.Transparent)) {
                    Row(
                        Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(PrimaryGreen, PrimaryRed, AccentYellow))).padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(Modifier.size(72.dp).clip(CircleShape).background(Color.White), contentAlignment = Alignment.Center) {
                            Icon(Icons.Outlined.Person, contentDescription = null, tint = PrimaryGreen, modifier = Modifier.size(38.dp))
                        }
                        Spacer(Modifier.width(16.dp))
                        Column {
                            Text(user.name.ifBlank { "Deal Hunter" }, color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                            Text(user.email, color = Color.White.copy(alpha = 0.9f))
                            Text(user.mobile, color = Color.White.copy(alpha = 0.9f))
                        }
                    }
                }
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard("Saved Deals", state.savedDeals.size.toString(), Modifier.weight(1f))
                    StatCard("Shared Deals", state.sharedDeals.size.toString(), Modifier.weight(1f))
                }
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard("Price Alerts", state.priceAlertDeals.size.toString(), Modifier.weight(1f))
                    StatCard("Recently Viewed", state.recentlyViewedDeals.size.toString(), Modifier.weight(1f))
                }
            }
            item {
                Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(Modifier.padding(8.dp)) {
                        ToggleRow("Notifications", "Receive hot deal alerts", user.notificationEnabled, onNotificationToggle)
                        ToggleRow("Dark Mode", "Use a rich low-light theme", user.darkModeEnabled, onDarkModeToggle)
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(Modifier.padding(8.dp)) {
                        ProfileRow(Icons.Outlined.FavoriteBorder, "Saved Deals", "View saved offers", onSavedDeals)
                        ProfileRow(Icons.Outlined.Share, "Shared Deals", "Deals you shared", onSharedDeals)
                        ProfileRow(Icons.Outlined.NotificationsActive, "Price Alerts", "Deals you are tracking", onPriceAlerts)
                        ProfileRow(Icons.Outlined.Visibility, "Recently Viewed", "Products you opened recently", onRecentlyViewed)
                        ProfileRow(Icons.Outlined.Language, "Language Settings", "English, Hindi, Marathi and more", onLanguage)
                        ProfileRow(Icons.Outlined.Settings, "Settings", "Preferences, support and app version", onSettings)
                        ProfileRow(Icons.Outlined.Info, "About App", "EnjoyFreeDeals by BizFlow Team", onAbout)
                        ProfileRow(Icons.Outlined.Policy, "Privacy Policy", "www.mywebz.in/privacy-policy", onAbout)
                        ProfileRow(Icons.Outlined.Policy, "Terms & Conditions", "www.mywebz.in/terms", onAbout)
                        ProfileRow(Icons.AutoMirrored.Outlined.Logout, "Logout", "Sign out from this device", onLogout, PrimaryRed)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier = modifier, shape = RoundedCornerShape(22.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(18.dp)) {
            Text(value, color = PrimaryGreen, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun ToggleRow(title: String, subtitle: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(if (checked) Icons.Outlined.ToggleOn else Icons.Outlined.ToggleOff, contentDescription = null, tint = PrimaryGreen)
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Bold)
            Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(checked = checked, onCheckedChange = onChange)
    }
}

@Composable
private fun ProfileRow(icon: ImageVector, title: String, subtitle: String, onClick: () -> Unit, tint: Color = PrimaryGreen) {
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).clickable(onClick = onClick).padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = tint)
        Spacer(Modifier.width(14.dp))
        Column {
            Text(title, fontWeight = FontWeight.Bold, color = if (tint == PrimaryRed) PrimaryRed else MaterialTheme.colorScheme.onSurface)
            Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
        }
    }
}
