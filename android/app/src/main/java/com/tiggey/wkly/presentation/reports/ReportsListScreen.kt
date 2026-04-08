package com.tiggey.wkly.presentation.reports

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.tiggey.wkly.data.model.WeeklySummary
import com.tiggey.wkly.presentation.components.common.GlassContainer
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary

@Composable
fun ReportsListScreen(navController: NavController, viewModel: ReportsViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    Column(Modifier.fillMaxSize()) {
        Surface(color = MaterialTheme.colorScheme.surface, tonalElevation = 2.dp) {
            Text("Reports", style = MaterialTheme.typography.headlineMedium, modifier = Modifier.padding(24.dp))
        }

        LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(bottom = 100.dp)) {
            // This Week Card
            item {
                GlassContainer(Modifier.fillMaxWidth().clickable { navController.navigate(NavRoutes.ReportDetail.createRoute(NavRoutes.ReportDetail.THIS_WEEK)) }) {
                    Column {
                        Text("This Week", style = MaterialTheme.typography.titleMedium, color = Primary)
                        Spacer(Modifier.height(8.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("Income", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("$${String.format("%.2f", uiState.currentWeekIncome)}", style = MaterialTheme.typography.titleMedium, color = Primary)
                            }
                            Column {
                                Text("Expenses", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("$${String.format("%.2f", uiState.currentWeekExpenses)}", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }
            }

            item { Text("Past Weeks", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp)) }

            if (uiState.summaries.isEmpty()) {
                item { Text("No past reports yet.", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(16.dp)) }
            } else {
                items(uiState.summaries) { summary ->
                    SummaryCard(summary) { navController.navigate(NavRoutes.ReportDetail.createRoute(summary.id)) }
                }
            }
        }
    }
}

@Composable
private fun SummaryCard(summary: WeeklySummary, onClick: () -> Unit) {
    Card(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Column(Modifier.padding(16.dp)) {
            Text("${summary.weekStartDate} - ${summary.weekEndDate}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(8.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Income: $${String.format("%.2f", summary.totalIncome)}", style = MaterialTheme.typography.bodyMedium, color = Primary)
                Text("Expenses: $${String.format("%.2f", summary.totalExpenses)}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.error)
            }
            val net = summary.totalIncome - summary.totalExpenses
            Text("Net: ${if (net >= 0) "+" else ""}$${String.format("%.2f", net)}", style = MaterialTheme.typography.titleSmall, color = if (net >= 0) Primary else MaterialTheme.colorScheme.error)
        }
    }
}
