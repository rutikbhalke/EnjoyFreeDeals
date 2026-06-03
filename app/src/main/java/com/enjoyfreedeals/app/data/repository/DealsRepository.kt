@file:Suppress("unused")

package com.enjoyfreedeals.app.data.repository

import android.util.Log
import com.enjoyfreedeals.app.data.model.Deal
import com.enjoyfreedeals.app.data.supabase.SupabaseConfig
import com.enjoyfreedeals.app.data.supabase.SupabaseClientProvider
import io.github.jan.supabase.postgrest.from

class DealsRepository {
    suspend fun getDeals(): List<Deal> {
        Log.d(
            TAG,
            "Supabase config: urlLoaded=${SupabaseConfig.supabaseUrl.isNotBlank()}, anonKey=${anonKeyStatus()}"
        )
        return runCatching {
            SupabaseClientProvider.client
                .from("deals")
                .select()
                .decodeList<Deal>()
                .filter { it.isVisibleDeal }
        }.onSuccess { deals ->
            Log.d(TAG, "Deals fetched from Supabase: ${deals.size}")
        }.onFailure { error ->
            Log.e(TAG, "Supabase deals fetch failed: ${error.message}", error)
        }.getOrThrow()
    }

    private fun anonKeyStatus(): String {
        val key = SupabaseConfig.anonKey
        return if (key.isBlank()) {
            "missing"
        } else {
            "loaded(...${key.takeLast(4)})"
        }
    }

    private companion object {
        const val TAG = "DealsRepository"
    }
}
