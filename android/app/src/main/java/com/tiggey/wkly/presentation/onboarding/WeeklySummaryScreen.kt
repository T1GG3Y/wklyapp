package com.tiggey.wkly.presentation.onboarding

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.tiggey.wkly.presentation.components.common.GlassContainer
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary

@Composable
fun WeeklySummaryScreen(navController: NavController, viewModel: WeeklySummaryViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isComplete) {
        if (uiState.isComplete) {
            navController.navigate(NavRoutes.Dashboard.route) { popUpTo(0) { inclusive = true } }
        }
    }

    Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconButton({ navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("Your Weekly Budget", style = MaterialTheme.typography.headlineMedium)
        }

        Spacer(Modifier.height(48.dp))

        Icon(Icons.Filled.CheckCircle, null, Modifier.size(80.dp), tint = Primary)

        Spacer(Modifier.height(24.dp))

        Text("You're all set!", style = MaterialTheme.typography.headlineMedium, textAlign = TextAlign.Center)

        Spacer(Modifier.height(16.dp))

        Text("Based on your income and expenses, here's your weekly budget:", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)

        Spacer(Modifier.height(32.dp))

        GlassContainer(Modifier.fillMaxWidth()) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text("Safe to Spend", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(8.dp))
                Text("$${String.format("%.2f", uiState.safeToSpend)}", style = MaterialTheme.typography.displaySmall, color = Primary)
                Spacer(Modifier.height(4.dp))
                Text("per week", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }

        Spacer(Modifier.height(16.dp))

        GlassContainer(Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Weekly Income", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("$${String.format("%.0f", uiState.weeklyIncome)}", style = MaterialTheme.typography.titleMedium, color = Primary)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Weekly Expenses", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("$${String.format("%.0f", uiState.weeklyExpenses)}", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.error)
                }
            }
        }

        Spacer(Modifier.weight(1f))

        if (uiState.error != null) {
            Text(uiState.error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(bottom = 16.dp))
        }

        WklyButton("Start Using WKLY", { viewModel.completeOnboarding() }, Modifier.fillMaxWidth(), isLoading = uiState.isLoading)
    }
}
