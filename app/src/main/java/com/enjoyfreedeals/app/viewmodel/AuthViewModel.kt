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
    val mobileError: String? = null,
    val otpError: String? = null,
    val message: String? = null,
    val successMessage: String? = null,
    val isOtpSent: Boolean = false,
    val pendingMobile: String = ""
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

    fun requestLoginOtp(mobile: String) {
        val normalizedMobile = ValidationUtils.normalizedMobile(mobile)
        val mobileError = ValidationUtils.validateMobile(normalizedMobile)
        if (mobileError != null) {
            _uiState.update {
                it.copy(mobileError = mobileError, otpError = null, message = null, successMessage = null)
            }
            return
        }

        viewModelScope.launch {
            _uiState.update {
                it.copy(
                    isLoading = true,
                    mobileError = null,
                    otpError = null,
                    message = null,
                    successMessage = null
                )
            }
            repository.requestWhatsAppOtp(normalizedMobile)
                .onSuccess { message ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isOtpSent = true,
                            pendingMobile = normalizedMobile,
                            successMessage = message
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            message = error.friendlyMessage("Could not send WhatsApp OTP. Please try again.")
                        )
                    }
                }
        }
    }

    fun verifyLoginOtp(mobile: String, otp: String) {
        val normalizedMobile = ValidationUtils.normalizedMobile(mobile)
        val mobileError = ValidationUtils.validateMobile(normalizedMobile)
        val otpError = ValidationUtils.validateOtp(otp)
        if (mobileError != null || otpError != null) {
            _uiState.update {
                it.copy(mobileError = mobileError, otpError = otpError, message = null, successMessage = null)
            }
            return
        }

        viewModelScope.launch {
            _uiState.update {
                it.copy(isLoading = true, mobileError = null, otpError = null, message = null, successMessage = null)
            }
            repository.verifyWhatsAppOtp(normalizedMobile, otp)
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
                        it.copy(isLoading = false, message = error.friendlyMessage("OTP verification failed."))
                    }
                }
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

