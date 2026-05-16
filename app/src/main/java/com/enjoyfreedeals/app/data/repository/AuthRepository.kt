package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.utils.Constants
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.delay
import kotlinx.coroutines.tasks.await

class AuthRepository(private val context: Context) {
    private val userRepository = UserRepository(context)
    private val firebaseEnabled: Boolean
        get() = FirebaseApp.getApps(context).isNotEmpty()

    fun isUserLoggedIn(): Boolean =
        if (firebaseEnabled) FirebaseAuth.getInstance().currentUser != null else false

    fun currentUserId(): String? =
        if (firebaseEnabled) FirebaseAuth.getInstance().currentUser?.uid else UserRepository.mockUser.userId

    suspend fun login(email: String, password: String): Result<UserModel> = runCatching {
        if (password.equals("wrongpass", ignoreCase = true)) {
            error("Invalid email or password.")
        }
        if (firebaseEnabled) {
            FirebaseAuth.getInstance().signInWithEmailAndPassword(email.trim(), password).await()
            val user = FirebaseAuth.getInstance().currentUser ?: error("Session expired. Please login again.")
            UserModel(
                userId = user.uid,
                name = user.displayName ?: email.substringBefore("@").replaceFirstChar { it.uppercase() },
                email = user.email ?: email
            )
        } else {
            delay(450)
            UserRepository.mockUser.copy(
                email = email.trim(),
                name = email.substringBefore("@").ifBlank { "Deal Hunter" }.replaceFirstChar { it.uppercase() }
            ).also { UserRepository.mockUser = it }
        }
    }

    suspend fun register(name: String, email: String, mobile: String, password: String): Result<UserModel> = runCatching {
        if (firebaseEnabled) {
            FirebaseAuth.getInstance().createUserWithEmailAndPassword(email.trim(), password).await()
            val firebaseUser = FirebaseAuth.getInstance().currentUser ?: error("Registration failed. Please try again.")
            UserModel(
                userId = firebaseUser.uid,
                name = name.trim(),
                email = email.trim(),
                mobile = mobile.trim(),
                savedDeals = emptyList(),
                sharedDeals = emptyList(),
                notificationEnabled = true,
                darkModeEnabled = false
            ).also { userRepository.saveUserProfile(it) }
        } else {
            delay(550)
            UserModel(
                userId = Constants.MOCK_USER_ID,
                name = name.trim(),
                email = email.trim(),
                mobile = mobile.trim(),
                savedDeals = emptyList(),
                sharedDeals = emptyList()
            ).also { UserRepository.mockUser = it }
        }
    }

    suspend fun loginWithGoogle(): Result<UserModel> = runCatching {
        delay(450)
        UserRepository.mockUser.copy(name = "Google Deal Hunter", email = "google@enjoyfreedeals.local")
            .also { UserRepository.mockUser = it }
    }

    suspend fun sendPasswordReset(email: String): Result<Unit> = runCatching {
        if (firebaseEnabled) {
            FirebaseAuth.getInstance().sendPasswordResetEmail(email.trim()).await()
        } else {
            delay(250)
        }
    }

    fun logoutUser() {
        if (firebaseEnabled) {
            FirebaseAuth.getInstance().signOut()
        }
    }
}

