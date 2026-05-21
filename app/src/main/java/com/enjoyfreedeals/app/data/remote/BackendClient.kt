package com.enjoyfreedeals.app.data.remote

import com.enjoyfreedeals.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URL

class BackendClient(
    private val baseUrl: String = BuildConfig.BACKEND_BASE_URL.trimEnd('/')
) {
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
        val connection = (URL("$baseUrl/${path.trimStart('/')}").openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15_000
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

        try {
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
        } catch (error: java.net.ConnectException) {
            throw IOException("Network connection failed. Start the backend server and check BACKEND_BASE_URL.", error)
        } finally {
            connection.disconnect()
        }
    }

    private fun readResponse(connection: HttpURLConnection, responseCode: Int): String {
        val stream = if (responseCode in 200..299) connection.inputStream else connection.errorStream
        return stream?.bufferedReader()?.use { it.readText() }.orEmpty()
    }
}

class BackendApiException(message: String) : Exception(message)
