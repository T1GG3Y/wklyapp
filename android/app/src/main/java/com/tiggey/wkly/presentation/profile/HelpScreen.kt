package com.tiggey.wkly.presentation.profile

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController

data class FaqItem(val question: String, val answer: String)

val faqItems = listOf(
    FaqItem("What is Safe to Spend?", "Safe to Spend is the amount you can spend freely after accounting for your required expenses. It's calculated as your weekly income minus your weekly required expenses, plus any rollover from the previous week."),
    FaqItem("What is Need to Spend?", "Need to Spend represents your planned discretionary spending for the week. It's the total of all your discretionary budget categories plus any rollover from the previous week."),
    FaqItem("How are weekly amounts calculated?", "We convert all your income and expenses to weekly amounts: Weekly stays the same, Bi-weekly is divided by 2, Monthly is divided by 4.33, and Yearly is divided by 52."),
    FaqItem("What happens to unused budget?", "Unused budget rolls over to the next week. If you don't spend your full Safe to Spend or Need to Spend budget, the remaining amount is added to next week's budget."),
    FaqItem("Can I change my week start day?", "You can change your week start day during the initial setup. Currently, this setting cannot be changed after onboarding without resetting your account."),
    FaqItem("How do I add a transaction?", "Tap the + button at the bottom of the screen or the 'Add a transaction' button on the dashboard. Select whether it's income or expense, enter the amount, choose a category, and optionally add a description.")
)

@Composable
fun HelpScreen(navController: NavController) {
    var expandedIndex by remember { mutableStateOf<Int?>(null) }

    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton({ navController.popBackStack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("Help & FAQ", style = MaterialTheme.typography.headlineMedium)
        }

        LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(faqItems.indices.toList()) { index ->
                val item = faqItems[index]
                val isExpanded = expandedIndex == index

                Card(Modifier.fillMaxWidth().clickable { expandedIndex = if (isExpanded) null else index }) {
                    Column(Modifier.padding(16.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(item.question, style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
                            Icon(if (isExpanded) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore, null)
                        }
                        AnimatedVisibility(isExpanded) {
                            Text(item.answer, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 12.dp))
                        }
                    }
                }
            }
        }
    }
}
