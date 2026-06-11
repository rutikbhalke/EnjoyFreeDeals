package com.enjoyfreedeals.app.utils

import java.net.URLEncoder

fun buildPlatformSearchUrl(platform: String, productTitle: String): String {
    val query = productTitle.trim().ifBlank { "deals" }
    val encoded = URLEncoder.encode(query, Charsets.UTF_8.name()).replace("+", "%20")
    val googleQuery = URLEncoder.encode("$query ${platform.trim()}".trim(), Charsets.UTF_8.name())
    return when (platform.normalizedPlatformKey()) {
        "amazon" -> "https://www.amazon.in/s?k=$encoded"
        "flipkart" -> "https://www.flipkart.com/search?q=$encoded"
        "meesho" -> "https://www.meesho.com/search?q=$encoded"
        "myntra" -> "https://www.myntra.com/$encoded"
        "ajio" -> "https://www.ajio.com/search/?text=$encoded"
        "tatacliq" -> "https://www.tatacliq.com/search/?searchCategory=all&text=$encoded"
        "croma" -> "https://www.croma.com/search/?text=$encoded"
        "nykaa" -> "https://www.nykaa.com/search/result/?q=$encoded"
        "snapdeal" -> "https://www.snapdeal.com/search?keyword=$encoded"
        "shopsy" -> "https://www.shopsy.in/search?q=$encoded"
        "reliancedigital" -> "https://www.reliancedigital.in/search?q=$encoded"
        "vijaysales" -> "https://www.vijaysales.com/search/$encoded"
        "jiomart" -> "https://www.jiomart.com/search/$encoded"
        "bigbasket" -> "https://www.bigbasket.com/ps/?q=$encoded"
        "blinkit" -> "https://blinkit.com/s/?q=$encoded"
        "zepto" -> "https://www.zeptonow.com/search?query=$encoded"
        "swiggyinstamart" -> "https://www.swiggy.com/instamart/search?query=$encoded"
        "firstcry" -> "https://www.firstcry.com/search.aspx?q=$encoded"
        "mamaearth" -> "https://mamaearth.in/search?q=$encoded"
        "purplle" -> "https://www.purplle.com/search?q=$encoded"
        "boat" -> "https://www.boat-lifestyle.com/search?q=$encoded"
        "noise" -> "https://www.gonoise.com/search?q=$encoded"
        "samsung" -> "https://www.samsung.com/in/search/?searchvalue=$encoded"
        "apple" -> "https://www.apple.com/in/search/$encoded"
        "oneplus" -> "https://www.oneplus.in/search?q=$encoded"
        "realme" -> "https://www.realme.com/in/search?keyword=$encoded"
        "mi" -> "https://www.mi.com/in/search/$encoded"
        "adidas" -> "https://www.adidas.co.in/search?q=$encoded"
        "nike" -> "https://www.nike.com/in/w?q=$encoded"
        "puma" -> "https://in.puma.com/in/en/search?q=$encoded"
        "decathlon" -> "https://www.decathlon.in/search?query=$encoded"
        "paytm" -> "https://paytm.com/search?q=$encoded"
        "phonepe" -> "https://www.phonepe.com/search?q=$encoded"
        "freecharge" -> "https://www.freecharge.in/search?q=$encoded"
        else -> "https://www.google.com/search?q=$googleQuery"
    }
}

private fun String.normalizedPlatformKey(): String =
    lowercase().replace(Regex("[^a-z0-9]+"), "")
