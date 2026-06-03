package com.enjoyfreedeals.app.data.remote

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class BackendClientTest {
    @Test
    fun backendBaseUrl_withoutTrailingSlash_addsTrailingSlash() {
        assertEquals(
            "http://debug-backend.test:5000/",
            BackendClient.normalizeBaseUrl("http://debug-backend.test:5000")
        )
    }

    @Test
    fun backendBaseUrl_withWhitespace_keepsHostAndPort() {
        assertEquals(
            "http://device-backend.test:5000/",
            BackendClient.normalizeBaseUrl(" http://device-backend.test:5000/ ")
        )
    }

    @Test
    fun backendBaseUrl_withoutScheme_isRejected() {
        assertThrows(IllegalArgumentException::class.java) {
            BackendClient.normalizeBaseUrl("debug-backend.test:5000")
        }
    }
}
