package com.enjoyfreedeals.app.data.supabase

import com.enjoyfreedeals.app.BuildConfig

object SupabaseConfig {
    val supabaseUrl: String = BuildConfig.SUPABASE_URL
    val anonKey: String = BuildConfig.SUPABASE_ANON_KEY

    val isConfigured: Boolean
        get() = supabaseUrl.isNotBlank() && anonKey.isNotBlank()
}
