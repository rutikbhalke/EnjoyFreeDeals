package com.enjoyfreedeals.app.data.supabase

import android.util.Log
import com.enjoyfreedeals.app.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime

object SupabaseClientProvider {
    val client: SupabaseClient by lazy {
        Log.d(
            TAG,
            "Creating Supabase client: urlLoaded=${BuildConfig.SUPABASE_URL.isNotBlank()}, anonKeyLoaded=${BuildConfig.SUPABASE_ANON_KEY.isNotBlank()}"
        )
        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Postgrest)
            install(Realtime)
        }
    }

    private const val TAG = "SupabaseClient"
}
