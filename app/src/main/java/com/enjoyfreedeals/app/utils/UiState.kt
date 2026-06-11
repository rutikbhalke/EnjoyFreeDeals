package com.enjoyfreedeals.app.utils

fun Throwable.friendlyMessage(default: String = "Something went wrong. Please try again."): String {
    val text = localizedMessage.orEmpty()
    return when {
        text.contains("PGRST205", ignoreCase = true) ||
            text.contains("schema cache", ignoreCase = true) ||
            text.contains("saved_deals", ignoreCase = true) ->
            "Saved deals table is missing in Supabase. Run the mobile profile SQL, then reopen the app."
        text.contains("backend", ignoreCase = true) ->
            "Backend server is unreachable. Start the backend and use 10.0.2.2 for emulator or your PC Wi-Fi IP for a phone."
        text.contains("network", ignoreCase = true) -> "Please check your internet connection."
        text.contains("permission", ignoreCase = true) -> "Permission denied. Please try again."
        text.contains("provider is not configured", ignoreCase = true) ||
            text.contains("MyOperator", ignoreCase = true) ->
            "WhatsApp OTP is not configured. Please contact support."
        text.contains("otp", ignoreCase = true) -> text
        text.contains("credential", ignoreCase = true) || text.contains("password", ignoreCase = true) ->
            "WhatsApp login failed. Please request a new OTP and try again."
        text.isNotBlank() -> text
        else -> default
    }
}
