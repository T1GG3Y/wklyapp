package com.tiggey.wkly.presentation.transaction

import androidx.compose.foundation.layout.*
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
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.components.common.WklyTextField
import com.tiggey.wkly.presentation.theme.Primary
import com.tiggey.wkly.presentation.theme.Secondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewTransactionScreen(navController: NavController, viewModel: TransactionViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) navController.popBackStack()
    }

    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconButton({ navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("New Transaction", style = MaterialTheme.typography.headlineMedium)
        }

        Spacer(Modifier.height(24.dp))

        // Type Toggle
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            FilterChip(uiState.type == "Expense", { viewModel.setType("Expense") }, { Text("Expense") }, colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Secondary.copy(alpha = 0.2f)))
            FilterChip(uiState.type == "Income", { viewModel.setType("Income") }, { Text("Income") }, colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Primary.copy(alpha = 0.2f)))
        }

        Spacer(Modifier.height(24.dp))

        // Amount
        WklyTextField(uiState.amount, { viewModel.setAmount(it.filter { c -> c.isDigit() || c == '.' }) }, label = "Amount", placeholder = "0.00", keyboardType = KeyboardType.Decimal, modifier = Modifier.fillMaxWidth())

        Spacer(Modifier.height(16.dp))

        // Category
        var expanded by remember { mutableStateOf(false) }
        ExposedDropdownMenuBox(expanded, { expanded = it }) {
            OutlinedTextField(uiState.category, {}, readOnly = true, label = { Text("Category") }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) }, modifier = Modifier.fillMaxWidth().menuAnchor())
            ExposedDropdownMenu(expanded, { expanded = false }) {
                uiState.categories.forEach { cat -> DropdownMenuItem({ Text(cat) }, { viewModel.setCategory(cat); expanded = false }) }
            }
        }

        Spacer(Modifier.height(16.dp))

        // Description
        WklyTextField(uiState.description, { viewModel.setDescription(it) }, label = "Description (optional)", placeholder = "Add a note", modifier = Modifier.fillMaxWidth())

        Spacer(Modifier.weight(1f))

        if (uiState.error != null) Text(uiState.error!!, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(bottom = 16.dp))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            WklyButton("Create & New", { viewModel.saveTransaction(false) }, Modifier.weight(1f), isLoading = uiState.isLoading, variant = com.tiggey.wkly.presentation.components.common.ButtonVariant.Outline)
            WklyButton("Create", { viewModel.saveTransaction(true) }, Modifier.weight(1f), isLoading = uiState.isLoading)
        }
    }
}
