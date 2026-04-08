package com.tiggey.wkly.presentation.profile

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.tiggey.wkly.presentation.components.common.GlassContainer
import com.tiggey.wkly.presentation.components.common.WklyButton
import com.tiggey.wkly.presentation.components.common.WklyTextField
import com.tiggey.wkly.presentation.navigation.NavRoutes
import com.tiggey.wkly.presentation.theme.Primary

@Composable
fun ProfileScreen(navController: NavController, viewModel: ProfileViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()
    var showDeleteDialog by remember { mutableStateOf(false) }
    var isEditing by remember { mutableStateOf(false) }
    var editName by remember { mutableStateOf("") }

    LaunchedEffect(uiState.isSignedOut) { if (uiState.isSignedOut) navController.navigate(NavRoutes.Login.route) { popUpTo(0) { inclusive = true } } }

    Column(Modifier.fillMaxSize()) {
        Surface(color = MaterialTheme.colorScheme.surface, tonalElevation = 2.dp) {
            Text("Profile", style = MaterialTheme.typography.headlineMedium, modifier = Modifier.padding(24.dp))
        }

        Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            // User Info
            GlassContainer(Modifier.fillMaxWidth()) {
                Column {
                    Text(uiState.email, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(8.dp))
                    if (isEditing) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            WklyTextField(editName, { editName = it }, label = "Name", modifier = Modifier.weight(1f))
                            IconButton({ viewModel.updateName(editName); isEditing = false }) { Icon(Icons.Filled.Check, "Save", tint = Primary) }
                            IconButton({ isEditing = false }) { Icon(Icons.Filled.Close, "Cancel") }
                        }
                    } else {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(uiState.displayName.ifEmpty { "No name set" }, style = MaterialTheme.typography.titleLarge)
                            IconButton({ editName = uiState.displayName; isEditing = true }) { Icon(Icons.Filled.Edit, "Edit") }
                        }
                    }
                }
            }

            // Menu Items
            Card(Modifier.fillMaxWidth()) {
                Column {
                    ProfileMenuItem(Icons.AutoMirrored.Filled.Help, "Help & FAQ") { navController.navigate(NavRoutes.Help.route) }
                    HorizontalDivider()
                    ProfileMenuItem(Icons.Filled.PrivacyTip, "Privacy Policy") { navController.navigate(NavRoutes.PrivacyPolicy.route) }
                }
            }

            Spacer(Modifier.weight(1f))

            // Sign Out
            WklyButton("Sign Out", { viewModel.signOut() }, Modifier.fillMaxWidth(), variant = com.tiggey.wkly.presentation.components.common.ButtonVariant.Outline)

            // Delete Account
            TextButton({ showDeleteDialog = true }, Modifier.align(Alignment.CenterHorizontally)) {
                Text("Delete Account", color = MaterialTheme.colorScheme.error)
            }
        }
    }

    if (showDeleteDialog) {
        AlertDialog(onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Account?") },
            text = { Text("This will permanently delete your account and all your data. This cannot be undone.") },
            confirmButton = { TextButton({ viewModel.deleteAccount(); showDeleteDialog = false }) { Text("Delete", color = MaterialTheme.colorScheme.error) } },
            dismissButton = { TextButton({ showDeleteDialog = false }) { Text("Cancel") } }
        )
    }
}

@Composable
private fun ProfileMenuItem(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(title, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
        Icon(Icons.Filled.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
