package com.enjoyfreedeals.app.utils

fun isActualDealUrl(url: String?): Boolean {
    val value = url?.trim().orEmpty()
    if (!value.startsWith("http://", ignoreCase = true) && !value.startsWith("https://", ignoreCase = true)) return false
    val uri = runCatching { java.net.URI(value) }.getOrNull() ?: return false
    val host = uri.host.orEmpty().lowercase().removePrefix("www.")
    val path = uri.path.orEmpty().trim('/').lowercase()
    if (host.isBlank() || path.isBlank()) return false
    if (value.isHomepageOnly(host, path)) return false
    return true
}

private fun String.isHomepageOnly(host: String, path: String): Boolean {
    if (path.isNotBlank()) return false
    val homepageHosts = setOf(
        "amazon.in",
        "flipkart.com",
        "meesho.com",
        "croma.com",
        "nykaa.com",
        "myntra.com",
        "ajio.com",
        "tatacliq.com",
        "snapdeal.com"
    )
    return host in homepageHosts
}
