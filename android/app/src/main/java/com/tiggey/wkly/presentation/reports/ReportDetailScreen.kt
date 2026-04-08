package com.tiggey.wkly.presentation.reports

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.tiggey.wkly.presentation.components.common.GlassContainer
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary

@Composable
fun ReportDetailScreen(navController: NavController, reportId: String, viewModel: ReportDetailViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(reportId) { viewModel.loadReport(reportId) }

    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconButton({ navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text(if (reportId == NavRoutes.ReportDetail.THIS_WEEK) "This Week" else "Weekly Report", style = MaterialTheme.typography.headlineMedium)
        }

        Spacer(Modifier.height(8.dp))
        Text("${uiState.weekStart} - ${uiState.weekEnd}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(Modifier.height(24.dp))

        // Summary Cards
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            GlassContainer(Modifier.weight(1f)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("Income", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("$${String.format("%.2f", uiState.totalIncome)}", style = MaterialTheme.typography.titleLarge, color = Primary)
                }
            }
            GlassContainer(Modifier.weight(1f)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("Expenses", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("$${String.format("%.2f", uiState.totalExpenses)}", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.error)
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        GlassContainer(Modifier.fillMaxWidth()) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text("Net Change", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                val net = uiState.totalIncome - uiState.totalExpenses
                Text("${if (net >= 0) "+" else ""}$${String.format("%.2f", net)}", style = MaterialTheme.typography.headlineMedium, color = if (net >= 0) Primary else MaterialTheme.colorScheme.error)
            }
        }

        Spacer(Modifier.height(24.dp))

        // Category breakdown
        Text("Spending by Category", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(12.dp))

        uiState.categoryBreakdown.forEach { (category, amount) ->
            Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(category, style = MaterialTheme.typography.bodyMedium)
                Text("$${String.format("%.2f", amount)}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
