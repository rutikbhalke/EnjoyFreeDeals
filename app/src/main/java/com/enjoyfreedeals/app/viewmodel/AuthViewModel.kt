package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.data.repository.AuthRepository
import com.enjoyfreedeals.app.utils.ValidationUtils
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthUiState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val user: UserModel? = null,
    val emailError: String? = null,
    val passwordError: String? = null,
    val nameError: String? = null,
    val mobileError: String? = null,
    val confirmPasswordError: String? = null,
    val message: String? = null,
    val successMessage: String? = null
)

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = AuthRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun checkSession() {
        if (repository.isUserLoggedIn()) {
            _uiState.update { it.copy(isAuthenticated = true, user = repository.currentUser()) }
        }
    }

    fun login(email: String, password: String) {
        val emailError = ValidationUtils.validateEmail(email)
        val passwordError = ValidationUtils.validatePassword(password)
        if (emailError != null || passwordError != null) {
            _uiState.update {
                it.copy(emailError = emailError, passwordError = passwordError, message = null, successMessage = null)
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, emailError = null, passwordError = null, message = null) }
            repository.login(email, password)
                .onSuccess { user ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isAuthenticated = true,
                            user = user,
                            successMessage = "Login successful."
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(isLoading = false, message = error.friendlyMessage("Login failed. Please try again."))
                    }
                }
        }
    }

    fun register(name: String, email: String, mobile: String, password: String, confirmPassword: String) {
        val normalizedMobile = ValidationUtils.normalizedMobile(mobile)
        val nameError = ValidationUtils.validateName(name)
        val emailError = ValidationUtils.validateEmail(email)
        val mobileError = ValidationUtils.validateMobile(normalizedMobile)
        val passwordError = ValidationUtils.validatePassword(password)
        val confirmError = ValidationUtils.validateConfirmPassword(password, confirmPassword)
        if (listOf(nameError, emailError, mobileError, passwordError, confirmError).any { it != null }) {
            _uiState.update {
                it.copy(
                    nameError = nameError,
                    emailError = emailError,
                    mobileError = mobileError,
                    passwordError = passwordError,
                    confirmPasswordError = confirmError,
                    message = null,
                    successMessage = null
                )
            }
            return
        }

        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoading = true,
                    nameError = null,
                    emailError = null,
                    mobileError = null,
                    passwordError = null,
                    confirmPasswordError = null,
                    message = null,
                    successMessage = null
                )
            }
            repository.register(name, email, normalizedMobile, password)
                .onSuccess { user ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isAuthenticated = true,
                            user = user,
                            nameError = null,
                            emailError = null,
                            mobileError = null,
                            passwordError = null,
                            confirmPasswordError = null,
                            successMessage = "Account created."
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(isLoading = false, message = error.friendlyMessage("Registration failed. Please try again."))
                    }
                }
        }
    }

    fun loginWithGoogle() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, message = null) }
            repository.loginWithGoogle()
                .onSuccess { user ->
                    _uiState.update {
                        it.copy(isLoading = false, isAuthenticated = true, user = user, successMessage = "Google login successful.")
                    }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(isLoading = false, message = error.friendlyMessage("Google login failed.")) }
                }
        }
    }

    fun forgotPassword(email: String) {
        val emailError = ValidationUtils.validateEmail(email)
        if (emailError != null) {
            _uiState.update { it.copy(emailError = emailError) }
            return
        }
        viewModelScope.launch {
            repository.sendPasswordReset(email)
            _uiState.update { it.copy(successMessage = "Password reset link sent.") }
        }
    }

    fun logout() {
        repository.logoutUser()
        _uiState.value = AuthUiState()
    }

    fun clearMessage() {
        _uiState.update { it.copy(message = null, successMessage = null) }
    }
}

