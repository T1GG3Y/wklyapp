package com.tiggey.wkly.presentation.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.tiggey.wkly.presentation.components.common.ButtonVariant
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary

@Composable
fun VerifyEmailScreen(
    navController: NavController,
    viewModel: VerifyEmailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isVerified) {
        if (uiState.isVerified) {
            navController.navigate(NavRoutes.OnboardingStartDay.route) {
                popUpTo(NavRoutes.VerifyEmail.route) { inclusive = true }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Email icon
        Icon(
            imageVector = Icons.Filled.Email,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = Primary
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Verify Your Email",
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Success message
        if (uiState.resendSuccess) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = Primary.copy(alpha = 0.1f)
                )
            ) {
                Text(
                    text = "Verification email sent!",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Primary,
                    modifier = Modifier.padding(16.dp)
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Error message
        if (uiState.error != null) {
            Text(
                text = uiState.error!!,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(bottom = 16.dp)
            )
        }

        // Check verification button
        WklyButton(
            text = "I've Verified My Email",
            onClick = { viewModel.checkVerification() },
            isLoading = uiState.isChecking,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Resend email button
        WklyButton(
            text = "Resend Verification Email",
            onClick = { viewModel.resendVerificationEmail() },
            isLoading = uiState.isResending,
            variant = ButtonVariant.Outline,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Sign out button
        TextButton(onClick = { viewModel.signOut(navController) }) {
            Text(
                text = "Sign Out",
                color = MaterialTheme.colorScheme.error
            )
        }
    }
}
