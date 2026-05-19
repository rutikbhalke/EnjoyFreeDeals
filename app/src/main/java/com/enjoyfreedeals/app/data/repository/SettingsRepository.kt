package com.enjoyfreedeals.app.data.repository

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore by preferencesDataStore(name = "enjoyfreedeals_settings")

data class AppSettings(
    val languageCode: String = "en",
    val darkModeEnabled: Boolean = false,
    val notificationsEnabled: Boolean = true
)

class SettingsRepository(private val context: Context) {
    private object Keys {
        val languageCode = stringPreferencesKey("language_code")
        val darkModeEnabled = booleanPreferencesKey("dark_mode_enabled")
        val notificationsEnabled = booleanPreferencesKey("notifications_enabled")
    }

    val settings: Flow<AppSettings> = context.settingsDataStore.data.map { prefs ->
        AppSettings(
            languageCode = prefs[Keys.languageCode] ?: "en",
            darkModeEnabled = prefs[Keys.darkModeEnabled] ?: false,
            notificationsEnabled = prefs[Keys.notificationsEnabled] ?: true
        )
    }

    suspend fun setLanguage(code: String) {
        context.settingsDataStore.edit { it[Keys.languageCode] = code }
    }

    suspend fun setDarkMode(enabled: Boolean) {
        context.settingsDataStore.edit { it[Keys.darkModeEnabled] = enabled }
    }

    suspend fun setNotifications(enabled: Boolean) {
        context.settingsDataStore.edit { it[Keys.notificationsEnabled] = enabled }
    }
}
