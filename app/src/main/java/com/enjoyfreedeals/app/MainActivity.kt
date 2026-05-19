package com.enjoyfreedeals.app

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.enjoyfreedeals.app.navigation.AppNavigation
import com.enjoyfreedeals.app.theme.EnjoyFreeDealsTheme
import com.enjoyfreedeals.app.utils.LocalAppStrings
import com.enjoyfreedeals.app.utils.Localization
import com.enjoyfreedeals.app.viewmodel.AuthViewModel
import com.enjoyfreedeals.app.viewmodel.BlogViewModel
import com.enjoyfreedeals.app.viewmodel.CategoryViewModel
import com.enjoyfreedeals.app.viewmodel.DealsViewModel
import com.enjoyfreedeals.app.viewmodel.HomeViewModel
import com.enjoyfreedeals.app.viewmodel.NotificationViewModel
import com.enjoyfreedeals.app.viewmodel.ProfileViewModel
import com.enjoyfreedeals.app.viewmodel.SettingsViewModel

class MainActivity : ComponentActivity() {
    private val authViewModel: AuthViewModel by viewModels()
    private val homeViewModel: HomeViewModel by viewModels()
    private val dealsViewModel: DealsViewModel by viewModels()
    private val categoryViewModel: CategoryViewModel by viewModels()
    private val blogViewModel: BlogViewModel by viewModels()
    private val notificationViewModel: NotificationViewModel by viewModels()
    private val profileViewModel: ProfileViewModel by viewModels()
    private val settingsViewModel: SettingsViewModel by viewModels()

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) notificationViewModel.saveFcmToken()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        requestNotificationPermissionIfNeeded()
        setContent {
            val profileState by profileViewModel.uiState.collectAsState()
            val settingsState by settingsViewModel.uiState.collectAsState()
            EnjoyFreeDealsTheme(darkTheme = profileState.user.darkModeEnabled || settingsState.settings.darkModeEnabled) {
                CompositionLocalProvider(LocalAppStrings provides Localization.stringsFor(settingsState.settings.languageCode)) {
                    AppNavigation(
                        authViewModel = authViewModel,
                        homeViewModel = homeViewModel,
                        dealsViewModel = dealsViewModel,
                        categoryViewModel = categoryViewModel,
                        blogViewModel = blogViewModel,
                        notificationViewModel = notificationViewModel,
                        profileViewModel = profileViewModel,
                        settingsViewModel = settingsViewModel
                    )
                }
            }
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            notificationViewModel.saveFcmToken()
        }
    }
}
