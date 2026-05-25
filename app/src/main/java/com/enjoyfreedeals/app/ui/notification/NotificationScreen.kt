package com.enjoyfreedeals.app.ui.notification

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.enjoyfreedeals.app.data.model.NotificationModel
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.theme.SoftGreen
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.SectionTitle
import com.enjoyfreedeals.app.ui.components.formatDate
import com.enjoyfreedeals.app.viewmodel.NotificationUiState

@Composable
fun NotificationScreen(
    state: NotificationUiState,
    onMarkAllRead: () -> Unit,
    onOpenNotification: (NotificationModel) -> Unit
) {
    PremiumBackground {
        LazyColumn(
            contentPadding = PaddingValues(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    SectionTitle("Notifications", Modifier.weight(1f), "${state.unreadCount} unread alerts")
                    TextButton(onClick = onMarkAllRead) { Text("Mark all read") }
                }
            }
            if (state.notifications.isEmpty()) {
                item { EmptyState("Empty notifications.", "Hot deals and coupons will appear here.") }
            } else {
                items(state.notifications, key = { it.notificationId }) { notification ->
                    NotificationCard(notification, onOpenNotification)
                }
            }
        }
    }
}

@Composable
private fun NotificationCard(notification: NotificationModel, onOpen: (NotificationModel) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onOpen(notification) },
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = notification.image,
                contentDescription = notification.title,
                modifier = Modifier.size(74.dp).clip(RoundedCornerShape(18.dp)),
                contentScale = ContentScale.Crop
            )
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(notification.title, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    if (!notification.isRead) {
                        Box(Modifier.size(10.dp).clip(CircleShape).background(PrimaryRed))
                    }
                }
                Text(notification.message, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(formatDate(notification.createdAt), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelSmall)
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = { onOpen(notification) },
                    colors = ButtonDefaults.buttonColors(containerColor = if (notification.isRead) SoftGreen else PrimaryGreen, contentColor = if (notification.isRead) PrimaryGreen else androidx.compose.ui.graphics.Color.White),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text("View Deal", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
