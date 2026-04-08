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
import com.tiggey.wkly.data.model.SavingsGoal
import com.tiggey.wkly.presentation.components.common.GlassContainer
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.components.common.WklyTextField
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary

val savingsCategories = listOf("Emergency Fund", "Vacation", "Home", "Car", "Education", "Retirement", "Investment", "Other")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SavingsGoalsScreen(navController: NavController, isEditMode: Boolean = false, viewModel: SavingsGoalsViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconButton({ navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text(if (isEditMode) "Edit Savings Goals" else "Savings Goals", style = MaterialTheme.typography.headlineMedium)
        }
        Text("Track your savings progress (optional)", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp))
        Spacer(Modifier.height(24.dp))
        GlassContainer(Modifier.fillMaxWidth()) {
            Column {
                Text("Total Savings Goals", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("$${String.format("%.2f", uiState.totalTarget)}", style = MaterialTheme.typography.headlineMedium, color = Primary)
                Text("$${String.format("%.2f", uiState.totalCurrent)} saved", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Spacer(Modifier.height(24.dp))
        LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(uiState.goals) { goal ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.fillMaxWidth().padding(16.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(goal.name, style = MaterialTheme.typography.titleMedium)
                                Text("${goal.category} - $${String.format("%.0f", goal.currentAmount)} / $${String.format("%.0f", goal.targetAmount)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            IconButton({ viewModel.deleteGoal(goal.id) }) { Icon(Icons.Filled.Delete, "Delete", tint = MaterialTheme.colorScheme.error) }
                        }
                        Spacer(Modifier.height(8.dp))
                        LinearProgressIndicator(progress = { goal.progress }, modifier = Modifier.fillMaxWidth().height(8.dp), color = Primary)
                    }
                }
            }
            item { OutlinedButton({ showAddDialog = true }, Modifier.fillMaxWidth()) { Icon(Icons.Filled.Add, null); Spacer(Modifier.width(8.dp)); Text("Add Savings Goal") } }
        }
        Spacer(Modifier.height(16.dp))
        WklyButton(if (isEditMode) "Save" else "Continue", { if (isEditMode) navController.popBackStack() else navController.navigate(NavRoutes.OnboardingWeeklySummary.route) }, Modifier.fillMaxWidth())
    }

    if (showAddDialog) {
        SavingsDialog({ showAddDialog = false }, { name, category, target, current -> viewModel.addGoal(name, category, target, current); showAddDialog = false })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SavingsDialog(onDismiss: () -> Unit, onSave: (String, String, Double, Double) -> Unit) {
    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Emergency Fund") }
    var target by remember { mutableStateOf("") }
    var current by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }

    AlertDialog(onDismissRequest = onDismiss, title = { Text("Add Savings Goal") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                WklyTextField(name, { name = it }, label = "Name", placeholder = "e.g., Vacation Fund", modifier = Modifier.fillMaxWidth())
                ExposedDropdownMenuBox(expanded, { expanded = it }) {
                    OutlinedTextField(category, {}, readOnly = true, label = { Text("Category") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) }, modifier = Modifier.fillMaxWidth().menuAnchor())
                    ExposedDropdownMenu(expanded, { expanded = false }) { savingsCategories.forEach { DropdownMenuItem({ Text(it) }, { category = it; expanded = false }) } }
                }
                WklyTextField(target, { target = it.filter { c -> c.isDigit() || c == '.' } }, label = "Target Amount", keyboardType = KeyboardType.Decimal, modifier = Modifier.fillMaxWidth())
                WklyTextField(current, { current = it.filter { c -> c.isDigit() || c == '.' } }, label = "Current Amount", keyboardType = KeyboardType.Decimal, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = { TextButton({ onSave(name, category, target.toDoubleOrNull() ?: 0.0, current.toDoubleOrNull() ?: 0.0) }, enabled = name.isNotBlank()) { Text("Save", color = Primary) } },
        dismissButton = { TextButton(onDismiss) { Text("Cancel") } }
    )
}
