package com.enjoyfreedeals.app.ui.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.PhoneAndroid
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.ui.components.AppLogo
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.utils.ValidationUtils
import com.enjoyfreedeals.app.viewmodel.AuthUiState

@Composable
fun LoginScreen(
    state: AuthUiState,
    onRequestOtp: (String) -> Unit,
    onVerifyOtp: (String, String) -> Unit,
    onSuccess: () -> Unit,
    onMessageShown: () -> Unit
) {
    var mobile by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }
    val otpSentForMobile = state.isOtpSent && state.pendingMobile == ValidationUtils.normalizedMobile(mobile)

    LaunchedEffect(state.isAuthenticated) {
        if (state.isAuthenticated) onSuccess()
    }
    LaunchedEffect(state.message, state.successMessage) {
        val message = state.message ?: state.successMessage
        if (message != null) {
            snackbarHostState.showSnackbar(message)
            onMessageShown()
        }
    }

    PremiumBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .navigationBarsPadding()
                .imePadding()
                .padding(22.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            AppLogo()
            Spacer(Modifier.height(18.dp))
            AuthCard(
                title = "Login with WhatsApp",
                subtitle = "Enter your mobile number to receive a secure OTP"
            ) {
                AuthField(
                    mobile,
                    { mobile = ValidationUtils.normalizedMobile(it) },
                    "WhatsApp Mobile Number",
                    Icons.Outlined.PhoneAndroid,
                    state.mobileError,
                    KeyboardType.Phone
                )
                AnimatedVisibility(otpSentForMobile || otp.isNotBlank()) {
                    Column {
                        Spacer(Modifier.height(12.dp))
                        AuthField(
                            otp,
                            { otp = it.filter { char -> char.isDigit() }.take(6) },
                            "Enter OTP",
                            Icons.Outlined.Lock,
                            state.otpError,
                            KeyboardType.NumberPassword
                        )
                    }
                }
                Spacer(Modifier.height(14.dp))
                OtpActionButton(
                    text = if (otpSentForMobile) "Resend WhatsApp OTP" else "Send WhatsApp OTP",
                    loading = state.isLoading,
                ) {
                    onRequestOtp(mobile)
                }
                Spacer(Modifier.height(12.dp))
                AuthButton(
                    if (state.isLoading) "Please wait..." else "Verify OTP",
                    state.isLoading
                ) {
                    onVerifyOtp(mobile, otp)
                }
                AuthStatusMessage(state.message ?: state.successMessage, state.message != null)
            }
        }
        SnackbarHost(snackbarHostState)
    }
}

@Composable
private fun AuthStatusMessage(message: String?, isError: Boolean) {
    AnimatedVisibility(!message.isNullOrBlank()) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 10.dp),
            color = if (isError) PrimaryRed.copy(alpha = 0.10f) else PrimaryGreen.copy(alpha = 0.10f),
            shape = RoundedCornerShape(14.dp)
        ) {
            Text(
                text = message.orEmpty(),
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                color = if (isError) PrimaryRed else PrimaryGreen,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun AuthCard(title: String, subtitle: String, content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(30.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 10.dp)
    ) {
        Column(Modifier.padding(22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            androidx.compose.foundation.layout.Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(PrimaryRed, AccentYellow, PrimaryGreen)))
                    .padding(horizontal = 16.dp, vertical = 7.dp)
            ) {
                Text("Premium Shopping Deals", color = Color.White, fontWeight = FontWeight.Black)
            }
            Spacer(Modifier.height(16.dp))
            Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.onSurface)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(20.dp))
            content()
        }
    }
}

@Composable
private fun AuthField(
    value: String,
    onChange: (String) -> Unit,
    label: String,
    icon: ImageVector,
    error: String?,
    keyboardType: KeyboardType = KeyboardType.Text
) {
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        modifier = Modifier.fillMaxWidth(),
        label = { Text(label) },
        leadingIcon = { Icon(icon, contentDescription = null) },
        isError = error != null,
        supportingText = { AnimatedVisibility(error != null) { Text(error.orEmpty()) } },
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        singleLine = true,
        shape = RoundedCornerShape(18.dp),
        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PrimaryGreen)
    )
}

@Composable
private fun OtpActionButton(text: String, loading: Boolean, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        enabled = !loading,
        modifier = Modifier.fillMaxWidth().height(52.dp),
        colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed),
        shape = RoundedCornerShape(18.dp)
    ) {
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
            Spacer(Modifier.width(10.dp))
        }
        Text(text, color = Color.White, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun AuthButton(text: String, loading: Boolean, enabled: Boolean = true, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        enabled = !loading && enabled,
        modifier = Modifier.fillMaxWidth().height(54.dp),
        colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
        shape = RoundedCornerShape(18.dp)
    ) {
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
            Spacer(Modifier.width(10.dp))
        }
        Text(text, fontWeight = FontWeight.Bold)
    }
}

