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
import com.tiggey.wkly.data.model.IncomeSource
import com.tiggey.wkly.presentation.components.common.GlassContainer
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.components.common.WklyTextField
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IncomeSetupScreen(
    navController: NavController,
    isEditMode: Boolean = false,
    viewModel: IncomeSetupViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var editingSource by remember { mutableStateOf<IncomeSource?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { navController.popBackStack() },
                modifier = Modifier.offset(x = (-12).dp)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back"
                )
            }
            Text(
                text = if (isEditMode) "Edit Income" else "Your Income",
                style = MaterialTheme.typography.headlineMedium
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Add your income sources to help calculate your weekly budget",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Summary card
        GlassContainer(modifier = Modifier.fillMaxWidth()) {
            Column {
                Text(
                    text = "Weekly Income",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "$${String.format("%.2f", uiState.weeklyTotal)}",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Primary
                )
                Text(
                    text = "$${String.format("%.2f", uiState.monthlyTotal)}/month",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Income sources list
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(uiState.incomeSources) { source ->
                IncomeSourceCard(
                    source = source,
                    onEdit = { editingSource = source },
                    onDelete = { viewModel.deleteIncomeSource(source.id) }
                )
            }

            item {
                OutlinedButton(
                    onClick = { showAddDialog = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Filled.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Add Income Source")
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Continue button
        WklyButton(
            text = if (isEditMode) "Save" else "Continue",
            onClick = {
                if (isEditMode) {
                    navController.popBackStack()
                } else {
                    navController.navigate(NavRoutes.OnboardingRequiredExpenses.route)
                }
            },
            modifier = Modifier.fillMaxWidth()
        )
    }

    // Add/Edit dialog
    if (showAddDialog || editingSource != null) {
        IncomeSourceDialog(
            source = editingSource,
            onDismiss = {
                showAddDialog = false
                editingSource = null
            },
            onSave = { name, amount, frequency ->
                if (editingSource != null) {
                    viewModel.updateIncomeSource(editingSource!!.id, name, amount, frequency)
                } else {
                    viewModel.addIncomeSource(name, amount, frequency)
                }
                showAddDialog = false
                editingSource = null
            }
        )
    }
}

@Composable
private fun IncomeSourceCard(
    source: IncomeSource,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        onClick = onEdit
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = source.name,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "$${String.format("%.2f", source.amount)} ${source.frequency}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            IconButton(onClick = onDelete) {
                Icon(
                    imageVector = Icons.Filled.Delete,
                    contentDescription = "Delete",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun IncomeSourceDialog(
    source: IncomeSource?,
    onDismiss: () -> Unit,
    onSave: (String, Double, String) -> Unit
) {
    var name by remember { mutableStateOf(source?.name ?: "") }
    var amount by remember { mutableStateOf(source?.amount?.toString() ?: "") }
    var frequency by remember { mutableStateOf(source?.frequency ?: "Monthly") }
    var expanded by remember { mutableStateOf(false) }

    val frequencies = listOf("Weekly", "Bi-weekly", "Monthly", "Yearly")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (source == null) "Add Income Source" else "Edit Income Source") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                WklyTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = "Name",
                    placeholder = "e.g., Salary, Freelance",
                    modifier = Modifier.fillMaxWidth()
                )

                WklyTextField(
                    value = amount,
                    onValueChange = { amount = it.filter { c -> c.isDigit() || c == '.' } },
                    label = "Amount",
                    placeholder = "0.00",
                    keyboardType = KeyboardType.Decimal,
                    modifier = Modifier.fillMaxWidth()
                )

                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = it }
                ) {
                    OutlinedTextField(
                        value = frequency,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Frequency") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        frequencies.forEach { freq ->
                            DropdownMenuItem(
                                text = { Text(freq) },
                                onClick = {
                                    frequency = freq
                                    expanded = false
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val amountValue = amount.toDoubleOrNull() ?: 0.0
                    if (name.isNotBlank() && amountValue > 0) {
                        onSave(name, amountValue, frequency)
                    }
                },
                enabled = name.isNotBlank() && (amount.toDoubleOrNull() ?: 0.0) > 0
            ) {
                Text("Save", color = Primary)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
