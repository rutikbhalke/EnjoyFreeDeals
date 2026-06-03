package com.enjoyfreedeals.app.data.remote

import com.enjoyfreedeals.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.URL

class BackendClient(
    baseUrl: String = BuildConfig.BACKEND_BASE_URL
) {
    private val baseUrls: List<String> = buildBaseUrls(baseUrl)

    suspend fun get(path: String, accessToken: String? = null): JSONObject =
        request("GET", path, null, accessToken)

    suspend fun post(path: String, body: JSONObject, accessToken: String? = null): JSONObject =
        request("POST", path, body, accessToken)

    suspend fun put(path: String, body: JSONObject, accessToken: String? = null): JSONObject =
        request("PUT", path, body, accessToken)

    suspend fun delete(path: String, accessToken: String? = null): JSONObject =
        request("DELETE", path, null, accessToken)

    private suspend fun request(
        method: String,
        path: String,
        body: JSONObject?,
        accessToken: String?
    ): JSONObject = withContext(Dispatchers.IO) {
        var lastNetworkError: IOException? = null
        for (candidateBaseUrl in baseUrls) {
            try {
                return@withContext requestOnce(candidateBaseUrl, method, path, body, accessToken)
            } catch (error: IOException) {
                lastNetworkError = IOException(
                    "Backend server is unreachable. Tried: ${baseUrls.joinToString()}",
                    error
                )
            }
        }
        throw lastNetworkError ?: IOException("Backend server is unreachable.")
    }

    private fun requestOnce(
        candidateBaseUrl: String,
        method: String,
        path: String,
        body: JSONObject?,
        accessToken: String?
    ): JSONObject {
        val connection = (URL("$candidateBaseUrl/${path.trimStart('/')}").openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 6_000
            readTimeout = 15_000
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Content-Type", "application/json")
            accessToken?.takeIf { it.isNotBlank() }?.let {
                setRequestProperty("Authorization", "Bearer $it")
            }
            if (body != null) {
                doOutput = true
            }
        }

        return try {
            if (body != null) {
                connection.outputStream.use { stream ->
                    stream.write(body.toString().toByteArray(Charsets.UTF_8))
                }
            }

            val responseCode = connection.responseCode
            val responseText = readResponse(connection, responseCode)
            val json = if (responseText.isBlank()) JSONObject() else JSONObject(responseText)

            if (responseCode !in 200..299 || json.optBoolean("success", true).not()) {
                throw BackendApiException(json.optString("message", "Backend request failed."))
            }

            json
        } catch (error: SocketTimeoutException) {
            throw IOException("Network timeout. Please check the backend server.", error)
        } catch (error: ConnectException) {
            throw IOException("Network connection failed. Start the backend server and check BACKEND_BASE_URL.", error)
        } finally {
            connection.disconnect()
        }
    }

    private fun readResponse(connection: HttpURLConnection, responseCode: Int): String {
        val stream = if (responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader()?.use { it.readText() }.orEmpty()
    }

    companion object {
        private const val EMULATOR_BACKEND_URL = "http://10.0.2.2:5000"

        fun normalizeBaseUrl(baseUrl: String): String {
            val trimmed = baseUrl.trim()
            require(trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                "BACKEND_BASE_URL must include http:// or https://"
            }
            return "${trimmed.trimEnd('/')}/"
        }

        private fun buildBaseUrls(primaryBaseUrl: String): List<String> {
            val urls = linkedSetOf(normalizeBaseUrl(primaryBaseUrl).trimEnd('/'))
            urls += normalizeBaseUrl(EMULATOR_BACKEND_URL).trimEnd('/')
            return urls.toList()
        }
    }
}

class BackendApiException(message: String) : Exception(message)
