package com.enjoyfreedeals.app.ui.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
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
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.PhoneAndroid
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.theme.AccentYellow
import com.enjoyfreedeals.app.theme.DarkText
import com.enjoyfreedeals.app.theme.PrimaryGreen
import com.enjoyfreedeals.app.theme.PrimaryRed
import com.enjoyfreedeals.app.ui.components.AppLogo
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.viewmodel.AuthUiState

@Composable
fun LoginScreen(
    state: AuthUiState,
    onLogin: (String, String) -> Unit,
    onGoogleLogin: () -> Unit,
    onForgotPassword: (String) -> Unit,
    onCreateAccount: () -> Unit,
    onSuccess: () -> Unit,
    onMessageShown: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }

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
                title = "Welcome Back, Deal Hunter!",
                subtitle = "Login to discover today's best shopping offers"
            ) {
                AuthField(email, { email = it }, "Email", Icons.Outlined.Email, state.emailError, KeyboardType.Email)
                Spacer(Modifier.height(12.dp))
                PasswordField(password, { password = it }, state.passwordError)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = { onForgotPassword(email) }) {
                        Text("Forgot Password?", color = PrimaryRed, fontWeight = FontWeight.Bold)
                    }
                }
                AuthButton("Login", state.isLoading) { onLogin(email, password) }
                Spacer(Modifier.height(12.dp))
                GoogleButton(state.isLoading, onGoogleLogin)
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("New here?", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    TextButton(onClick = onCreateAccount) {
                        Text("Create Account", color = PrimaryGreen, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
        SnackbarHost(snackbarHostState)
    }
}

@Composable
fun CreateAccountScreen(
    state: AuthUiState,
    onRegister: (String, String, String, String, String) -> Unit,
    onGoogleLogin: () -> Unit,
    onLogin: () -> Unit,
    onSuccess: () -> Unit,
    onMessageShown: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var mobile by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }

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
            AppLogo(compact = true)
            Spacer(Modifier.height(18.dp))
            AuthCard("Create Account", "Join EnjoyFreeDeals and start saving today") {
                AuthField(name, { name = it }, "Full Name", Icons.Outlined.Person, state.nameError)
                Spacer(Modifier.height(10.dp))
                AuthField(email, { email = it }, "Email", Icons.Outlined.Email, state.emailError, KeyboardType.Email)
                Spacer(Modifier.height(10.dp))
                AuthField(mobile, { mobile = it }, "Mobile Number", Icons.Outlined.PhoneAndroid, state.mobileError, KeyboardType.Phone)
                Spacer(Modifier.height(10.dp))
                PasswordField(password, { password = it }, state.passwordError)
                Spacer(Modifier.height(10.dp))
                PasswordField(confirm, { confirm = it }, state.confirmPasswordError, "Confirm Password")
                Spacer(Modifier.height(16.dp))
                AuthButton("Create Account", state.isLoading) { onRegister(name, email, mobile, password, confirm) }
                Spacer(Modifier.height(12.dp))
                GoogleButton(state.isLoading, onGoogleLogin)
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Already have an account?", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    TextButton(onClick = onLogin) {
                        Text("Login", color = PrimaryGreen, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
        SnackbarHost(snackbarHostState)
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
private fun PasswordField(
    value: String,
    onChange: (String) -> Unit,
    error: String?,
    label: String = "Password"
) {
    var visible by remember { mutableStateOf(false) }
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        modifier = Modifier.fillMaxWidth(),
        label = { Text(label) },
        leadingIcon = { Icon(Icons.Outlined.Lock, contentDescription = null) },
        trailingIcon = {
            IconButton(onClick = { visible = !visible }) {
                Icon(if (visible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility, contentDescription = null)
            }
        },
        visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
        isError = error != null,
        supportingText = { AnimatedVisibility(error != null) { Text(error.orEmpty()) } },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        singleLine = true,
        shape = RoundedCornerShape(18.dp),
        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PrimaryGreen)
    )
}

@Composable
private fun AuthButton(text: String, loading: Boolean, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        enabled = !loading,
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

@Composable
private fun GoogleButton(loading: Boolean, onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        enabled = !loading,
        modifier = Modifier.fillMaxWidth().height(52.dp),
        shape = RoundedCornerShape(18.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Text("G", color = PrimaryRed, fontWeight = FontWeight.Black)
        Spacer(Modifier.width(10.dp))
        Text("Continue with Google", color = DarkText, fontWeight = FontWeight.Bold)
    }
}
