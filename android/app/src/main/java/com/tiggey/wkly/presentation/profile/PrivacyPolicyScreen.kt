package com.tiggey.wkly.presentation.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController

@Composable
fun PrivacyPolicyScreen(navController: NavController) {
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton({ navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("Privacy Policy", style = MaterialTheme.typography.headlineMedium)
        }

        Column(Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            PolicySection("Information We Collect", "We collect information you provide directly to us, including your email address, name, and financial data you enter into the app such as income sources, expenses, and transactions.")

            PolicySection("How We Use Your Information", "We use the information we collect to provide, maintain, and improve our services, to process transactions, and to send you technical notices and support messages.")

            PolicySection("Data Storage", "Your data is stored securely using Firebase, a Google Cloud service. All data is encrypted in transit and at rest. We do not sell your personal information to third parties.")

            PolicySection("Data Retention", "We retain your personal information for as long as your account is active. You can request deletion of your account and all associated data at any time through the app settings.")

            PolicySection("Your Rights", "You have the right to access, correct, or delete your personal information. You can export your data or request account deletion through the Profile section of the app.")

            PolicySection("Changes to This Policy", "We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the app.")

            PolicySection("Contact Us", "If you have any questions about this privacy policy, please contact us through the Help section of the app.")
        }
    }
}

@Composable
private fun PolicySection(title: String, content: String) {
    Column {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        Text(content, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
