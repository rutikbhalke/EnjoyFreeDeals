package com.enjoyfreedeals.app.utils

object ValidationUtils {
    private val emailRegex = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")

    fun validateEmail(email: String): String? = when {
        email.isBlank() -> "Email cannot be empty."
        !emailRegex.matches(email.trim()) -> "Please enter a valid email address."
        else -> null
    }

    fun validatePassword(password: String): String? = when {
        password.isBlank() -> "Password cannot be empty."
        password.length < 6 -> "Password must be at least 6 characters."
        else -> null
    }

    fun validateName(name: String): String? = when {
        name.trim().isEmpty() -> "Full name cannot be empty."
        name.trim().length < 2 -> "Please enter your full name."
        else -> null
    }

    fun validateMobile(mobile: String): String? = when {
        normalizedMobile(mobile).isBlank() -> "Mobile number cannot be empty."
        normalizedMobile(mobile).length != 10 -> "Mobile number must be 10 digits."
        else -> null
    }

    fun normalizedMobile(mobile: String): String =
        mobile.filter { it.isDigit() }.take(10)

    fun validateConfirmPassword(password: String, confirmPassword: String): String? = when {
        confirmPassword.isBlank() -> "Confirm password cannot be empty."
        password != confirmPassword -> "Confirm password must match password."
        else -> null
    }
}
