package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.UserModel

object AuthSessionStore {
    private const val PREFS_NAME = "backend_auth_session"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_NAME = "name"
    private const val KEY_EMAIL = "email"
    private const val KEY_MOBILE = "mobile"
    private const val KEY_PROFILE_IMAGE = "profile_image"
    private const val KEY_ACCESS_TOKEN = "access_token"
    private const val KEY_REFRESH_TOKEN = "refresh_token"
    private const val KEY_EXPIRES_AT = "expires_at"

    fun save(
        context: Context,
        user: UserModel,
        accessToken: String,
        refreshToken: String,
        expiresAt: Long
    ) {
        prefs(context).edit()
            .putString(KEY_USER_ID, user.userId)
            .putString(KEY_NAME, user.name)
            .putString(KEY_EMAIL, user.email)
            .putString(KEY_MOBILE, user.mobile)
            .putString(KEY_PROFILE_IMAGE, user.profileImage)
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .putLong(KEY_EXPIRES_AT, expiresAt)
            .apply()
    }

    fun updateUser(context: Context, user: UserModel) {
        prefs(context).edit()
            .putString(KEY_USER_ID, user.userId)
            .putString(KEY_NAME, user.name)
            .putString(KEY_EMAIL, user.email)
            .putString(KEY_MOBILE, user.mobile)
            .putString(KEY_PROFILE_IMAGE, user.profileImage)
            .apply()
    }

    fun clear(context: Context) {
        prefs(context).edit().clear().apply()
    }

    fun isLoggedIn(context: Context): Boolean {
        val token = accessToken(context)
        val userId = currentUserId(context)
        val expiresAt = prefs(context).getLong(KEY_EXPIRES_AT, 0L)
        val isExpired = expiresAt > 0 && expiresAt * 1000 <= System.currentTimeMillis()
        return !token.isNullOrBlank() && !userId.isNullOrBlank() && !isExpired
    }

    fun currentUserId(context: Context): String? =
        prefs(context).getString(KEY_USER_ID, null)

    fun accessToken(context: Context): String? =
        prefs(context).getString(KEY_ACCESS_TOKEN, null)

    fun currentUser(context: Context): UserModel? {
        val userId = currentUserId(context) ?: return null
        return UserModel(
            userId = userId,
            name = prefs(context).getString(KEY_NAME, "").orEmpty(),
            email = prefs(context).getString(KEY_EMAIL, "").orEmpty(),
            mobile = prefs(context).getString(KEY_MOBILE, "").orEmpty(),
            profileImage = prefs(context).getString(KEY_PROFILE_IMAGE, "").orEmpty()
        )
    }

    fun registerListener(
        context: Context,
        listener: android.content.SharedPreferences.OnSharedPreferenceChangeListener
    ) {
        prefs(context).registerOnSharedPreferenceChangeListener(listener)
    }

    fun unregisterListener(
        context: Context,
        listener: android.content.SharedPreferences.OnSharedPreferenceChangeListener
    ) {
        prefs(context).unregisterOnSharedPreferenceChangeListener(listener)
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
