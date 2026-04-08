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
import com.tiggey.wkly.data.model.Loan
import com.tiggey.wkly.presentation.components.common.GlassContainer
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.components.common.WklyTextField
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary

val loanCategories = listOf("Credit Card", "Auto Loan", "Student Loan", "Mortgage", "Personal Loan", "Other")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoansSetupScreen(navController: NavController, isEditMode: Boolean = false, viewModel: LoansSetupViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text(if (isEditMode) "Edit Loans" else "Your Loans", style = MaterialTheme.typography.headlineMedium)
        }
        Text("Track your loan balances (optional)", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp))
        Spacer(Modifier.height(24.dp))
        GlassContainer(Modifier.fillMaxWidth()) {
            Column {
                Text("Total Debt", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("$${String.format("%.2f", uiState.totalDebt)}", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.error)
            }
        }
        Spacer(Modifier.height(24.dp))
        LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(uiState.loans) { loan ->
                Card(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(loan.name, style = MaterialTheme.typography.titleMedium)
                            Text("${loan.category} - $${String.format("%.2f", loan.totalBalance)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        IconButton(onClick = { viewModel.deleteLoan(loan.id) }) { Icon(Icons.Filled.Delete, "Delete", tint = MaterialTheme.colorScheme.error) }
                    }
                }
            }
            item { OutlinedButton(onClick = { showAddDialog = true }, Modifier.fillMaxWidth()) { Icon(Icons.Filled.Add, null); Spacer(Modifier.width(8.dp)); Text("Add Loan") } }
        }
        Spacer(Modifier.height(16.dp))
        WklyButton(if (isEditMode) "Save" else "Continue", { if (isEditMode) navController.popBackStack() else navController.navigate(NavRoutes.OnboardingDiscretionary.route) }, Modifier.fillMaxWidth())
    }

    if (showAddDialog) {
        LoanDialog(onDismiss = { showAddDialog = false }, onSave = { name, category, balance -> viewModel.addLoan(name, category, balance); showAddDialog = false })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LoanDialog(onDismiss: () -> Unit, onSave: (String, String, Double) -> Unit) {
    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Credit Card") }
    var balance by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }

    AlertDialog(onDismissRequest = onDismiss, title = { Text("Add Loan") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                WklyTextField(name, { name = it }, label = "Name", placeholder = "e.g., Chase Card", modifier = Modifier.fillMaxWidth())
                ExposedDropdownMenuBox(expanded, { expanded = it }) {
                    OutlinedTextField(category, {}, readOnly = true, label = { Text("Category") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) }, modifier = Modifier.fillMaxWidth().menuAnchor())
                    ExposedDropdownMenu(expanded, { expanded = false }) { loanCategories.forEach { DropdownMenuItem({ Text(it) }, { category = it; expanded = false }) } }
                }
                WklyTextField(balance, { balance = it.filter { c -> c.isDigit() || c == '.' } }, label = "Balance", keyboardType = KeyboardType.Decimal, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = { TextButton({ onSave(name, category, balance.toDoubleOrNull() ?: 0.0) }, enabled = name.isNotBlank()) { Text("Save", color = Primary) } },
        dismissButton = { TextButton(onDismiss) { Text("Cancel") } }
    )
}
