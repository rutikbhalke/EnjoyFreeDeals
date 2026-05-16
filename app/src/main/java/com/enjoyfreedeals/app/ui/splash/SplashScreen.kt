package com.enjoyfreedeals.app.ui.splash

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.ui.components.AppLogo
import com.enjoyfreedeals.app.ui.components.SparkleCanvas
import com.enjoyfreedeals.app.utils.Constants
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun SplashScreen(
    isLoggedIn: Boolean,
    onFinished: (Boolean) -> Unit
) {
    val scale = remember { Animatable(0.68f) }
    val alpha = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        launch { scale.animateTo(1f, tween(1100, easing = FastOutSlowInEasing)) }
        launch { alpha.animateTo(1f, tween(900)) }
        delay(2500)
        onFinished(isLoggedIn)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    listOf(Color.White, AccentYellow.copy(alpha = 0.34f), PrimaryGreen.copy(alpha = 0.20f), PrimaryRed.copy(alpha = 0.13f))
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        SparkleCanvas(Modifier.fillMaxSize())
        Column(
            modifier = Modifier
                .padding(horizontal = 24.dp)
                .graphicsLayer {
                    scaleX = scale.value
                    scaleY = scale.value
                    this.alpha = alpha.value
                },
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            AppLogo()
            Spacer(Modifier.height(18.dp))
            Text(
                Constants.TAGLINE,
                style = MaterialTheme.typography.headlineSmall,
                color = PrimaryGreen,
                fontWeight = FontWeight.Black
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Free deals, coupons, cashback and shopping offers",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

