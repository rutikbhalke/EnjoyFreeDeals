package com.enjoyfreedeals.app.utils

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent

object CustomTabsHelper {
    fun normalizeUrl(url: String): String {
        val trimmed = url.trim()
        return when {
            trimmed.isBlank() -> ""
            trimmed.startsWith("http://", ignoreCase = true) -> trimmed
            trimmed.startsWith("https://", ignoreCase = true) -> trimmed
            else -> "https://$trimmed"
        }
    }

    fun openDealUrl(
        context: Context,
        dealUrl: String,
        onError: (String) -> Unit = {}
    ): Boolean {
        val normalized = normalizeUrl(dealUrl)
        if (normalized.isBlank()) {
            onError("Deal link not available.")
            return false
        }

        val uri = Uri.parse(normalized)
        return try {
            CustomTabsIntent.Builder()
                .setShowTitle(true)
                .setShareState(CustomTabsIntent.SHARE_STATE_ON)
                .build()
                .launchUrl(context, uri)
            true
        } catch (_: Exception) {
            try {
                val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
                true
            } catch (_: Exception) {
                onError("Unable to open deal link.")
                false
            }
        }
    }
}

