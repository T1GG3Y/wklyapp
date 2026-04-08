package com.tiggey.wkly.presentation.transaction

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.components.common.WklyTextField
import com.tiggey.wkly.presentation.theme.Primary
import com.tiggey.wkly.presentation.theme.Secondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditTransactionScreen(navController: NavController, transactionId: String, viewModel: EditTransactionViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    var showDeleteDialog by remember { mutableStateOf(false) }

    LaunchedEffect(transactionId) { viewModel.loadTransaction(transactionId) }
    LaunchedEffect(uiState.isSuccess) { if (uiState.isSuccess) navController.popBackStack() }

    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton({ navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
                Text("Edit Transaction", style = MaterialTheme.typography.headlineMedium)
            }
            IconButton({ showDeleteDialog = true }) { Icon(Icons.Filled.Delete, "Delete", tint = MaterialTheme.colorScheme.error) }
        }

        Spacer(Modifier.height(24.dp))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            FilterChip(uiState.type == "Expense", { viewModel.setType("Expense") }, { Text("Expense") }, colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Secondary.copy(alpha = 0.2f)))
            FilterChip(uiState.type == "Income", { viewModel.setType("Income") }, { Text("Income") }, colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Primary.copy(alpha = 0.2f)))
        }

        Spacer(Modifier.height(24.dp))

        WklyTextField(uiState.amount, { viewModel.setAmount(it.filter { c -> c.isDigit() || c == '.' }) }, label = "Amount", keyboardType = KeyboardType.Decimal, modifier = Modifier.fillMaxWidth())

        Spacer(Modifier.height(16.dp))

        var expanded by remember { mutableStateOf(false) }
        ExposedDropdownMenuBox(expanded, { expanded = it }) {
            OutlinedTextField(uiState.category, {}, readOnly = true, label = { Text("Category") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) }, modifier = Modifier.fillMaxWidth().menuAnchor())
            ExposedDropdownMenu(expanded, { expanded = false }) { uiState.categories.forEach { cat -> DropdownMenuItem({ Text(cat) }, { viewModel.setCategory(cat); expanded = false }) } }
        }

        Spacer(Modifier.height(16.dp))

        WklyTextField(uiState.description, { viewModel.setDescription(it) }, label = "Description (optional)", modifier = Modifier.fillMaxWidth())

        Spacer(Modifier.weight(1f))

        if (uiState.error != null) Text(uiState.error!!, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(bottom = 16.dp))

        WklyButton("Save Changes", { viewModel.updateTransaction() }, Modifier.fillMaxWidth(), isLoading = uiState.isLoading)
    }

    if (showDeleteDialog) {
        AlertDialog(onDismissRequest = { showDeleteDialog = false }, title = { Text("Delete Transaction?") }, text = { Text("This action cannot be undone.") },
            confirmButton = { TextButton({ viewModel.deleteTransaction(); showDeleteDialog = false }) { Text("Delete", color = MaterialTheme.colorScheme.error) } },
            dismissButton = { TextButton({ showDeleteDialog = false }) { Text("Cancel") } })
    }
}
