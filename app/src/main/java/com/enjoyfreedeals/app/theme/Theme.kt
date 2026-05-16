package com.enjoyfreedeals.app.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColors = lightColorScheme(
    primary = PrimaryGreen,
    onPrimary = Color.White,
    secondary = PrimaryRed,
    onSecondary = Color.White,
    tertiary = AccentYellow,
    onTertiary = DarkText,
    background = AppBackground,
    onBackground = DarkText,
    surface = CardWhite,
    onSurface = DarkText,
    surfaceVariant = Color(0xFFEFF3EF),
    onSurfaceVariant = GreyText,
    error = PrimaryRed
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF6EE79B),
    onPrimary = Color(0xFF06270F),
    secondary = Color(0xFFFF7379),
    onSecondary = Color(0xFF3A0508),
    tertiary = AccentYellow,
    onTertiary = DarkText,
    background = DarkBackground,
    onBackground = Color.White,
    surface = DarkCard,
    onSurface = Color.White,
    surfaceVariant = Color(0xFF243329),
    onSurfaceVariant = Color(0xFFD4DDD6),
    error = Color(0xFFFF7379)
)

@Composable
fun EnjoyFreeDealsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val scheme = if (darkTheme) DarkColors else LightColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = scheme.background.toArgb()
            window.navigationBarColor = scheme.background.toArgb()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
            }
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = scheme,
        typography = AppTypography,
        content = content
    )
}

