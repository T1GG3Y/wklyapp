package com.tiggey.wkly.presentation.budget

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
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
fun BudgetScreen(navController: NavController, viewModel: BudgetViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    var expandedSection by remember { mutableStateOf<String?>("Income") }

    Column(Modifier.fillMaxSize()) {
        Surface(color = MaterialTheme.colorScheme.surface, tonalElevation = 2.dp) {
            Text("Budget", style = MaterialTheme.typography.headlineMedium, modifier = Modifier.padding(24.dp))
        }

        LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(bottom = 100.dp)) {
            // Income Section
            item {
                BudgetSection("Income", "$${String.format("%.2f", uiState.weeklyIncome)}/week", expandedSection == "Income",
                    { expandedSection = if (expandedSection == "Income") null else "Income" }, { navController.navigate(NavRoutes.EditIncome.route) }) {
                    uiState.incomeSources.forEach { source ->
                        BudgetItem(source.name, "$${String.format("%.2f", source.amount)} ${source.frequency}")
                    }
                }
            }

            // Required Expenses Section
            item {
                BudgetSection("Required Expenses", "$${String.format("%.2f", uiState.weeklyRequired)}/week", expandedSection == "Required",
                    { expandedSection = if (expandedSection == "Required") null else "Required" }, { navController.navigate(NavRoutes.EditRequiredExpenses.route) }) {
                    uiState.requiredExpenses.forEach { expense ->
                        BudgetItem(expense.category, "$${String.format("%.2f", expense.amount)} ${expense.frequency}")
                    }
                }
            }

            // Discretionary Section
            item {
                BudgetSection("Discretionary", "$${String.format("%.2f", uiState.weeklyDiscretionary)}/week", expandedSection == "Discretionary",
                    { expandedSection = if (expandedSection == "Discretionary") null else "Discretionary" }, { navController.navigate(NavRoutes.EditDiscretionary.route) }) {
                    uiState.discretionaryExpenses.forEach { expense ->
                        BudgetItem(expense.category, "$${String.format("%.2f", expense.plannedAmount)}/week")
                    }
                }
            }

            // Loans Section
            item {
                BudgetSection("Loans", "$${String.format("%.2f", uiState.totalDebt)} total", expandedSection == "Loans",
                    { expandedSection = if (expandedSection == "Loans") null else "Loans" }, { navController.navigate(NavRoutes.EditLoans.route) }) {
                    uiState.loans.forEach { loan ->
                        BudgetItem(loan.name, "$${String.format("%.2f", loan.totalBalance)} (${loan.category})")
                    }
                }
            }

            // Savings Section
            item {
                BudgetSection("Savings Goals", "$${String.format("%.2f", uiState.totalSavings)} goal", expandedSection == "Savings",
                    { expandedSection = if (expandedSection == "Savings") null else "Savings" }, { navController.navigate(NavRoutes.EditSavings.route) }) {
                    uiState.savingsGoals.forEach { goal ->
                        BudgetItem(goal.name, "$${String.format("%.0f", goal.currentAmount)} / $${String.format("%.0f", goal.targetAmount)}")
                    }
                }
            }
        }
    }
}

@Composable
private fun BudgetSection(title: String, subtitle: String, isExpanded: Boolean, onToggle: () -> Unit, onEdit: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    GlassContainer(Modifier.fillMaxWidth()) {
        Column {
            Row(Modifier.fillMaxWidth().clickable(onClick = onToggle), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text(title, style = MaterialTheme.typography.titleMedium)
                    Text(subtitle, style = MaterialTheme.typography.bodySmall, color = Primary)
                }
                Row {
                    IconButton(onEdit) { Icon(Icons.Filled.Edit, "Edit", tint = MaterialTheme.colorScheme.onSurfaceVariant) }
                    Icon(if (isExpanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore, "Toggle", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            AnimatedVisibility(isExpanded) {
                Column(Modifier.padding(top = 16.dp), content = content)
            }
        }
    }
}

@Composable
private fun BudgetItem(name: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(name, style = MaterialTheme.typography.bodyMedium)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
