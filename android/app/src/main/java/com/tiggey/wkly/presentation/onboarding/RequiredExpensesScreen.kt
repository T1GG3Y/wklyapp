package com.tiggey.wkly.presentation.onboarding

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.tiggey.wkly.data.model.RequiredExpense
import com.tiggey.wkly.presentation.components.common.GlassContainer
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.components.common.WklyTextField
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary

val requiredExpenseCategories = listOf(
    "Rent/Mortgage", "Utilities", "Insurance", "Car Payment",
    "Phone", "Internet", "Groceries", "Gas", "Child Care", "Other"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequiredExpensesScreen(
    navController: NavController,
    isEditMode: Boolean = false,
    viewModel: RequiredExpensesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var editingExpense by remember { mutableStateOf<RequiredExpense?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
            }
            Text(
                text = if (isEditMode) "Edit Required Expenses" else "Required Expenses",
                style = MaterialTheme.typography.headlineMedium
            )
        }

        Text(
            text = "Add your fixed monthly expenses",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 8.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        GlassContainer(modifier = Modifier.fillMaxWidth()) {
            Column {
                Text("Weekly Required", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("$${String.format("%.2f", uiState.weeklyTotal)}", style = MaterialTheme.typography.headlineMedium, color = Primary)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(uiState.expenses) { expense ->
                Card(modifier = Modifier.fillMaxWidth(), onClick = { editingExpense = expense }) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(expense.category, style = MaterialTheme.typography.titleMedium)
                            Text("$${String.format("%.2f", expense.amount)} ${expense.frequency}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        IconButton(onClick = { viewModel.deleteExpense(expense.id) }) {
                            Icon(Icons.Filled.Delete, "Delete", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
            item {
                OutlinedButton(onClick = { showAddDialog = true }, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Filled.Add, null)
                    Spacer(Modifier.width(8.dp))
                    Text("Add Required Expense")
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        WklyButton(
            text = if (isEditMode) "Save" else "Continue",
            onClick = { if (isEditMode) navController.popBackStack() else navController.navigate(NavRoutes.OnboardingLoans.route) },
            modifier = Modifier.fillMaxWidth()
        )
    }

    if (showAddDialog || editingExpense != null) {
        RequiredExpenseDialog(
            expense = editingExpense,
            onDismiss = { showAddDialog = false; editingExpense = null },
            onSave = { category, amount, frequency ->
                if (editingExpense != null) viewModel.updateExpense(editingExpense!!.id, category, amount, frequency)
                else viewModel.addExpense(category, amount, frequency)
                showAddDialog = false; editingExpense = null
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RequiredExpenseDialog(expense: RequiredExpense?, onDismiss: () -> Unit, onSave: (String, Double, String) -> Unit) {
    var category by remember { mutableStateOf(expense?.category ?: "") }
    var amount by remember { mutableStateOf(expense?.amount?.toString() ?: "") }
    var frequency by remember { mutableStateOf(expense?.frequency ?: "Monthly") }
    var categoryExpanded by remember { mutableStateOf(false) }
    var frequencyExpanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (expense == null) "Add Required Expense" else "Edit Expense") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                ExposedDropdownMenuBox(expanded = categoryExpanded, onExpandedChange = { categoryExpanded = it }) {
                    OutlinedTextField(value = category, onValueChange = {}, readOnly = true, label = { Text("Category") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(categoryExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor())
                    ExposedDropdownMenu(expanded = categoryExpanded, onDismissRequest = { categoryExpanded = false }) {
                        requiredExpenseCategories.forEach { cat ->
                            DropdownMenuItem(text = { Text(cat) }, onClick = { category = cat; categoryExpanded = false })
                        }
                    }
                }
                WklyTextField(value = amount, onValueChange = { amount = it.filter { c -> c.isDigit() || c == '.' } },
                    label = "Amount", keyboardType = KeyboardType.Decimal, modifier = Modifier.fillMaxWidth())
                ExposedDropdownMenuBox(expanded = frequencyExpanded, onExpandedChange = { frequencyExpanded = it }) {
                    OutlinedTextField(value = frequency, onValueChange = {}, readOnly = true, label = { Text("Frequency") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(frequencyExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor())
                    ExposedDropdownMenu(expanded = frequencyExpanded, onDismissRequest = { frequencyExpanded = false }) {
                        listOf("Weekly", "Monthly", "Yearly").forEach { freq ->
                            DropdownMenuItem(text = { Text(freq) }, onClick = { frequency = freq; frequencyExpanded = false })
                        }
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = { onSave(category, amount.toDoubleOrNull() ?: 0.0, frequency) }, enabled = category.isNotBlank() && (amount.toDoubleOrNull() ?: 0.0) > 0) { Text("Save", color = Primary) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
