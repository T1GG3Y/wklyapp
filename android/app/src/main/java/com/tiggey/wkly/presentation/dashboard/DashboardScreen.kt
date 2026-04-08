package com.tiggey.wkly.presentation.dashboard

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.tiggey.wkly.data.model.Transaction
import com.tiggey.wkly.presentation.components.budget.ProgressCircle
import com.tiggey.wkly.presentation.components.common.GlassContainer
import com.tiggey.wkly.presentation.components.common.LoadingIndicator
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary
import com.tiggey.wkly.presentation.theme.Secondary
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DashboardScreen(navController: NavController, viewModel: DashboardViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    if (uiState.isLoading) {
        LoadingIndicator()
        return
    }

    Column(Modifier.fillMaxSize()) {
        // Header
        Surface(color = MaterialTheme.colorScheme.surface, tonalElevation = 2.dp) {
            Text("Dashboard", style = MaterialTheme.typography.headlineMedium, modifier = Modifier.padding(24.dp))
        }

        LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp), contentPadding = PaddingValues(top = 16.dp, bottom = 100.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            // Budget Progress
            item {
                GlassContainer(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) {
                        ProgressCircle("Safe to Spend", uiState.remainingSafeToSpend, uiState.totalSafeToSpend, uiState.safeToSpendProgress, Primary, uiState.safeToSpendRollover)
                        ProgressCircle("Need to Spend", uiState.remainingNeedToSpend, uiState.totalNeedToSpend, uiState.needToSpendProgress, Secondary, uiState.needToSpendRollover)
                    }
                }
            }

            // Add Transaction Button
            item {
                WklyButton("Add a transaction", { navController.navigate(NavRoutes.NewTransaction.route) }, Modifier.fillMaxWidth())
            }

            // Recent Transactions Header
            item {
                Text("Recent Activity", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp))
            }

            // Transactions
            if (uiState.transactions.isEmpty()) {
                item { Text("No recent transactions.", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(16.dp)) }
            } else {
                items(uiState.transactions) { transaction ->
                    TransactionItem(transaction) { navController.navigate(NavRoutes.EditTransaction.createRoute(transaction.id)) }
                }
            }
        }
    }
}

@Composable
private fun TransactionItem(transaction: Transaction, onClick: () -> Unit) {
    val dateFormat = remember { SimpleDateFormat("MMM d, yyyy", Locale.US) }
    Card(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(if (transaction.isIncome) Icons.Filled.ArrowUpward else Icons.Filled.ArrowDownward, null, Modifier.size(24.dp), tint = if (transaction.isIncome) Primary else Secondary)
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text(transaction.description.ifEmpty { transaction.category }, style = MaterialTheme.typography.titleSmall)
                Text(transaction.date?.toDate()?.let { dateFormat.format(it) } ?: "", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text("${if (transaction.isIncome) "+" else "-"}$${String.format("%.2f", transaction.amount)}", style = MaterialTheme.typography.titleMedium, color = if (transaction.isIncome) Primary else Secondary)
        }
    }
}
