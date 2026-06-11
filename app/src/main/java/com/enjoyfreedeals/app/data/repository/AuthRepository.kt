package com.enjoyfreedeals.app.data.repository

import android.content.Context
import android.util.Log
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import org.json.JSONObject

class AuthRepository(private val context: Context) {
    private val backendClient = BackendClient()

    fun isUserLoggedIn(): Boolean {
        val user = AuthSessionStore.currentUser(context)
        if (user != null) {
            UserRepository.mockUser = user
        }
        return AuthSessionStore.isLoggedIn(context)
    }

    fun currentUser(): UserModel? =
        AuthSessionStore.currentUser(context)

    suspend fun requestWhatsAppOtp(mobile: String): Result<String> =
        runCatching {
            Log.d(TAG, "Request OTP API: /api/auth/whatsapp/request-otp")
            val response = backendClient.post(
                "/api/auth/whatsapp/request-otp",
                JSONObject().put("mobile", mobile.trim())
            )
            Log.d(TAG, "Request OTP success=${response.optBoolean("success", false)}")
            response.optJSONObject("data")?.optString("message")?.takeIf { it.isNotBlank() }
                ?: response.optString("message").takeIf { it.isNotBlank() }
                ?: "WhatsApp OTP sent."
        }

    suspend fun verifyWhatsAppOtp(
        mobile: String,
        otp: String
    ): Result<UserModel> = runCatching {
        val payload = JSONObject()
            .put("mobile", mobile.trim())
            .put("otp", otp.trim())

        Log.d(TAG, "Verify OTP API: /api/auth/whatsapp/verify-otp")
        val response = backendClient.post("/api/auth/whatsapp/verify-otp", payload)
        Log.d(TAG, "Verify OTP success=${response.optBoolean("success", false)}")
        persistAuthResponse(response)
    }

    fun logoutUser() {
        AuthSessionStore.clear(context)
    }

    private fun persistAuthResponse(response: JSONObject): UserModel {
        val data = response.getJSONObject("data")
        val user = data.getJSONObject("user").toUserModel()
        AuthSessionStore.save(
            context = context,
            user = user,
            accessToken = data.optString("accessToken"),
            refreshToken = data.optString("refreshToken"),
            expiresAt = data.optLong("expiresAt")
        )
        UserRepository.mockUser = user
        return user
    }

    private fun JSONObject.toUserModel(): UserModel =
        UserModel(
            userId = optString("userId"),
            name = optString("name"),
            email = optString("email"),
            mobile = optString("mobile"),
            profileImage = optString("profileImage")
        )

    companion object {
        private const val TAG = "AuthRepository"
    }
}
