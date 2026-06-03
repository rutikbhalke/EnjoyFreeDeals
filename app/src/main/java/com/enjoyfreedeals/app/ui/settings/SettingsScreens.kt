package com.enjoyfreedeals.app.ui.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DeleteSweep
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.Mail
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.SectionTitle
import com.enjoyfreedeals.app.utils.Constants
import com.enjoyfreedeals.app.utils.Localization
import com.enjoyfreedeals.app.utils.LocalAppStrings
import com.enjoyfreedeals.app.viewmodel.SettingsUiState

@Composable
fun SettingsScreen(
    state: SettingsUiState,
    onLanguageClick: () -> Unit,
    onDarkModeToggle: (Boolean) -> Unit,
    onNotificationToggle: (Boolean) -> Unit,
    onClearSavedDeals: () -> Unit,
    onAbout: () -> Unit
) {
    val strings = LocalAppStrings.current
    PremiumBackground {
        LazyColumn(contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item { SectionTitle(strings.settings, subtitle = "Manage app preferences and support") }
            item {
                Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(Modifier.padding(8.dp)) {
                        SettingsRow(Icons.Outlined.Language, strings.language, state.settings.languageCode.uppercase(), onLanguageClick)
                        ToggleSettingsRow("Dark mode", "Use a rich low-light theme", state.settings.darkModeEnabled, onDarkModeToggle)
                        ToggleSettingsRow("Notifications", "Receive deal and price alerts", state.settings.notificationsEnabled, onNotificationToggle)
                        SettingsRow(Icons.Outlined.DeleteSweep, "Clear saved deals", "Remove all bookmarked deals", onClearSavedDeals, PrimaryRed)
                    }
                }
            }
            item {
                Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(Modifier.padding(8.dp)) {
                        SettingsRow(Icons.Outlined.Info, "About EnjoyFreeDeals", "Version ${Constants.VERSION_NAME}", onAbout)
                        SettingsRow(Icons.Outlined.Mail, "Contact support", Constants.SUPPORT_EMAIL, onAbout)
                    }
                }
            }
        }
    }
}

@Composable
fun LanguageSettingsScreen(
    selectedLanguageCode: String,
    onSelectLanguage: (String) -> Unit
) {
    val strings = LocalAppStrings.current
    PremiumBackground {
        LazyColumn(contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item { SectionTitle(strings.language, subtitle = "Choose the app language") }
            items(Localization.supportedLanguages, key = { it.code }) { language ->
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onSelectLanguage(language.code) },
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(language.nativeName, fontWeight = FontWeight.Black)
                            Text(language.displayName, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        if (selectedLanguageCode == language.code) {
                            Text("Selected", color = PrimaryGreen, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsRow(icon: ImageVector, title: String, subtitle: String, onClick: () -> Unit, tint: Color = PrimaryGreen) {
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

@Composable
private fun ToggleSettingsRow(title: String, subtitle: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(if (checked) Icons.Outlined.ToggleOn else Icons.Outlined.ToggleOff, contentDescription = null, tint = PrimaryGreen)
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Bold)
            Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
        }
        Switch(checked = checked, onCheckedChange = onChange)
    }
}
