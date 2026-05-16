package com.enjoyfreedeals.app

import com.enjoyfreedeals.app.utils.ValidationUtils
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ValidationUtilsTest {
    @Test
    fun login_emptyEmailPassword_returnsErrors() {
        assertEquals("Email cannot be empty.", ValidationUtils.validateEmail(""))
        assertEquals("Password cannot be empty.", ValidationUtils.validatePassword(""))
    }

    @Test
    fun login_invalidEmail_returnsError() {
        assertEquals("Please enter a valid email address.", ValidationUtils.validateEmail("bad-email"))
    }

    @Test
    fun login_wrongShortPassword_returnsError() {
        assertEquals("Password must be at least 6 characters.", ValidationUtils.validatePassword("123"))
    }

    @Test
    fun login_correctInput_hasNoErrors() {
        assertNull(ValidationUtils.validateEmail("deal@enjoyfreedeals.com"))
        assertNull(ValidationUtils.validatePassword("secret1"))
    }

    @Test
    fun registration_emptyFields_returnErrors() {
        assertEquals("Full name cannot be empty.", ValidationUtils.validateName(""))
        assertEquals("Mobile number cannot be empty.", ValidationUtils.validateMobile(""))
    }

    @Test
    fun registration_invalidMobileAndPasswordMismatch_returnErrors() {
        assertEquals("Mobile number must be 10 digits.", ValidationUtils.validateMobile("12345"))
        assertEquals("Confirm password must match password.", ValidationUtils.validateConfirmPassword("secret1", "secret2"))
    }

    @Test
    fun registration_validInput_hasNoErrors() {
        assertNull(ValidationUtils.validateName("Deal Hunter"))
        assertNull(ValidationUtils.validateEmail("hunter@enjoyfreedeals.com"))
        assertNull(ValidationUtils.validateMobile("9876543210"))
        assertNull(ValidationUtils.validatePassword("secret1"))
        assertNull(ValidationUtils.validateConfirmPassword("secret1", "secret1"))
    }
}

