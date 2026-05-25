package com.enjoyfreedeals.app.data.repository

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.enjoyfreedeals.app.BuildConfig
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.data.remote.BackendClient
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
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

    suspend fun loginWithGoogle(activityContext: Context): Result<UserModel> = runCatching {
        val idToken = requestGoogleIdToken(activityContext)
        val response = backendClient.post(
            "/api/auth/google",
            JSONObject().put("idToken", idToken)
        )
        persistAuthResponse(response)
    }

    suspend fun sendPasswordReset(email: String): Result<Unit> =
        runCatching {
            backendClient.post(
                "/api/auth/password-reset",
                JSONObject().put("email", email.trim())
            )
        }.map { }

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

    private suspend fun requestGoogleIdToken(activityContext: Context): String {
        val webClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID.trim()
        if (webClientId.isBlank()) {
            error("Google sign-in is not configured. Set GOOGLE_WEB_CLIENT_ID for the Android build.")
        }

        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(webClientId)
            .setAutoSelectEnabled(false)
            .build()
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        val credential = try {
            CredentialManager.create(activityContext)
                .getCredential(activityContext, request)
                .credential
        } catch (error: GetCredentialCancellationException) {
            throw IllegalStateException("Google sign-in was cancelled.", error)
        } catch (error: NoCredentialException) {
            throw IllegalStateException("No Google account is available. Please choose or add an account.", error)
        } catch (error: GetCredentialException) {
            throw IllegalStateException("Google sign-in failed. Please try again.", error)
        }

        if (credential !is CustomCredential ||
            credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
        ) {
            error("Google sign-in did not return a valid ID token.")
        }

        val googleCredential = try {
            GoogleIdTokenCredential.createFrom(credential.data)
        } catch (error: GoogleIdTokenParsingException) {
            throw IllegalStateException("Google sign-in token could not be parsed.", error)
        }

        return googleCredential.idToken.takeIf { it.isNotBlank() }
            ?: error("Google sign-in did not return an ID token.")
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
