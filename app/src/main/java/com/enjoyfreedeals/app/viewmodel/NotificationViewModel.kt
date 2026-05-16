package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.NotificationModel
import com.enjoyfreedeals.app.data.repository.NotificationRepository
import com.enjoyfreedeals.app.data.repository.UserRepository
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotificationUiState(
    val notifications: List<NotificationModel> = emptyList(),
    val unreadCount: Int = 0,
    val isLoading: Boolean = true,
    val message: String? = null
)

class NotificationViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = NotificationRepository(application.applicationContext)
    private val userRepository = UserRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(NotificationUiState())
    val uiState: StateFlow<NotificationUiState> = _uiState.asStateFlow()

    init {
        loadNotifications()
    }

    fun loadNotifications() {
        val userId = userRepository.getCurrentUserId().orEmpty()
        viewModelScope.launch {
            repository.getUserNotifications(userId).collect { notifications ->
                _uiState.update {
                    it.copy(
                        notifications = notifications,
                        unreadCount = notifications.count { notification -> !notification.isRead },
                        isLoading = false
                    )
                }
            }
        }
    }

    fun markAsRead(notification: NotificationModel) {
        viewModelScope.launch {
            repository.markNotificationAsRead(notification.notificationId)
            _uiState.update {
                it.copy(
                    notifications = it.notifications.map { item ->
                        if (item.notificationId == notification.notificationId) item.copy(isRead = true) else item
                    },
                    unreadCount = (it.unreadCount - 1).coerceAtLeast(0)
                )
            }
        }
    }

    fun markAllAsRead() {
        val userId = userRepository.getCurrentUserId().orEmpty()
        viewModelScope.launch {
            repository.markAllNotificationsAsRead(userId)
            _uiState.update {
                it.copy(notifications = it.notifications.map { item -> item.copy(isRead = true) }, unreadCount = 0)
            }
        }
    }

    fun saveFcmToken() {
        val userId = userRepository.getCurrentUserId().orEmpty()
        viewModelScope.launch {
            runCatching { repository.getAndSaveFcmToken(userId) }
                .onSuccess { _uiState.update { state -> state.copy(message = "Notifications enabled.") } }
                .onFailure { error -> _uiState.update { state -> state.copy(message = error.friendlyMessage()) } }
        }
    }
}

