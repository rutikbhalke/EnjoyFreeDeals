package com.enjoyfreedeals.app.utils

sealed interface UiState<out T> {
    data object Idle : UiState<Nothing>
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

fun Throwable.friendlyMessage(default: String = "Something went wrong. Please try again."): String {
    val text = localizedMessage.orEmpty()
    return when {
        text.contains("network", ignoreCase = true) -> "Please check your internet connection."
        text.contains("permission", ignoreCase = true) -> "Permission denied. Please try again."
        text.contains("password", ignoreCase = true) -> "Invalid email or password."
        text.contains("user", ignoreCase = true) -> "Account not found. Please create an account."
        text.isNotBlank() -> text
        else -> default
    }
}
