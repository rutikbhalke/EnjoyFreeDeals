package com.enjoyfreedeals.app.ui.about

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.AppInfoModel
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.ui.components.AppLogo
import com.enjoyfreedeals.app.ui.components.PremiumBackground

@Composable
fun AboutScreen(info: AppInfoModel = AppInfoModel(), onOpenUrl: (String) -> Unit) {
    PremiumBackground {
        LazyColumn(contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(Modifier.padding(22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        AppLogo()
                        Spacer(Modifier.height(10.dp))
                        Text(info.appName, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                        Text(info.tagline, color = PrimaryGreen, fontWeight = FontWeight.Bold)
                        Text("Version ${info.version}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.height(18.dp))
                        InfoLine("Created By", info.createdBy)
                        InfoLine("Website", info.website)
                        InfoLine("Support Email", info.supportEmail)
                        Spacer(Modifier.height(14.dp))
                        Text(info.description, style = MaterialTheme.typography.bodyLarge)
                        Spacer(Modifier.height(18.dp))
                        Button(
                            onClick = { onOpenUrl(info.privacyPolicyUrl) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("Privacy Policy", fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(10.dp))
                        Button(
                            onClick = { onOpenUrl(info.termsUrl) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("Terms & Conditions", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoLine(label: String, value: String) {
    Column(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Text(label, fontWeight = FontWeight.Bold)
        Text(value, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

