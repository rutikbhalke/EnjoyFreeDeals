package com.enjoyfreedeals.app.data.repository

import android.content.Context
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

    fun currentUserId(): String? =
        AuthSessionStore.currentUserId(context)

    fun currentUser(): UserModel? =
        AuthSessionStore.currentUser(context)

    suspend fun login(email: String, password: String): Result<UserModel> = runCatching {
        val response = backendClient.post(
            "/api/auth/login",
            JSONObject()
                .put("email", email.trim())
                .put("password", password)
        )
        persistAuthResponse(response)
    }

    suspend fun register(name: String, email: String, mobile: String, password: String): Result<UserModel> =
        runCatching {
            val response = backendClient.post(
                "/api/auth/register",
                JSONObject()
                    .put("name", name.trim())
                    .put("email", email.trim())
                    .put("mobile", mobile.trim())
                    .put("password", password)
            )
            persistAuthResponse(response)
        }

    suspend fun loginWithGoogle(): Result<UserModel> = runCatching {
        error("Google login is not connected to the backend yet.")
    }

    suspend fun sendPasswordReset(email: String): Result<Unit> = runCatching {
        backendClient.post(
            "/api/auth/password-reset",
            JSONObject().put("email", email.trim())
        )
        Unit
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
}
