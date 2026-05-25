package com.enjoyfreedeals.app.utils

fun Throwable.friendlyMessage(default: String = "Something went wrong. Please try again."): String {
    val text = localizedMessage.orEmpty()
    return when {
        text.contains("backend", ignoreCase = true) -> "Backend server is unreachable. Start the backend and check BACKEND_BASE_URL."
        text.contains("network", ignoreCase = true) -> "Please check your internet connection."
        text.contains("permission", ignoreCase = true) -> "Permission denied. Please try again."
        text.contains("password", ignoreCase = true) -> "Invalid email or password."
        text.contains("user", ignoreCase = true) -> "Account not found. Please create an account."
        text.isNotBlank() -> text
        else -> default
    }
}
