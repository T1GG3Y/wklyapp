package com.tiggey.wkly.presentation.onboarding

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.tiggey.wkly.presentation.components.common.GlassContainer
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.components.common.WklyTextField
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary

val discretionaryCategories = listOf("Dining Out", "Entertainment", "Shopping", "Subscriptions", "Personal Care", "Hobbies", "Travel", "Gifts", "Coffee/Snacks", "Fitness", "Other")

@Composable
fun DiscretionarySetupScreen(navController: NavController, isEditMode: Boolean = false, viewModel: DiscretionarySetupViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedCategory by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconButton({ navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text(if (isEditMode) "Edit Discretionary" else "Discretionary Budget", style = MaterialTheme.typography.headlineMedium)
        }
        Text("Set weekly budgets for flexible spending", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp))
        Spacer(Modifier.height(24.dp))
        GlassContainer(Modifier.fillMaxWidth()) {
            Column {
                Text("Weekly Discretionary", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("$${String.format("%.2f", uiState.weeklyTotal)}", style = MaterialTheme.typography.headlineMedium, color = Primary)
            }
        }
        Spacer(Modifier.height(24.dp))
        LazyVerticalGrid(GridCells.Fixed(2), Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(discretionaryCategories) { category ->
                val expense = uiState.expenses.find { it.category == category }
                val amount = expense?.plannedAmount ?: 0.0
                Card(onClick = { selectedCategory = category }, colors = CardDefaults.cardColors(containerColor = if (amount > 0) Primary.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surfaceVariant)) {
                    Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(category, style = MaterialTheme.typography.labelMedium)
                        if (amount > 0) Text("$${String.format("%.0f", amount)}", style = MaterialTheme.typography.titleMedium, color = Primary)
                    }
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        WklyButton(if (isEditMode) "Save" else "Continue", { if (isEditMode) navController.popBackStack() else navController.navigate(NavRoutes.OnboardingSavings.route) }, Modifier.fillMaxWidth())
    }

    selectedCategory?.let { category ->
        AmountDialog(category, uiState.expenses.find { it.category == category }?.plannedAmount ?: 0.0,
            onDismiss = { selectedCategory = null },
            onSave = { amount -> viewModel.setAmount(category, amount); selectedCategory = null },
            onDelete = { viewModel.deleteExpense(category); selectedCategory = null }
        )
    }
}

@Composable
private fun AmountDialog(category: String, currentAmount: Double, onDismiss: () -> Unit, onSave: (Double) -> Unit, onDelete: () -> Unit) {
    var amount by remember { mutableStateOf(if (currentAmount > 0) currentAmount.toString() else "") }
    AlertDialog(onDismissRequest = onDismiss, title = { Text(category) },
        text = { WklyTextField(amount, { amount = it.filter { c -> c.isDigit() || c == '.' } }, label = "Weekly Budget", keyboardType = KeyboardType.Decimal, modifier = Modifier.fillMaxWidth()) },
        confirmButton = { TextButton({ onSave(amount.toDoubleOrNull() ?: 0.0) }) { Text("Save", color = Primary) } },
        dismissButton = {
            Row {
                if (currentAmount > 0) TextButton(onDelete) { Text("Remove", color = MaterialTheme.colorScheme.error) }
                TextButton(onDismiss) { Text("Cancel") }
            }
        }
    )
}
