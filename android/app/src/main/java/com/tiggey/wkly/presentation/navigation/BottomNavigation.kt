package com.tiggey.wkly.presentation.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.PieChart
import androidx.compose.material.icons.outlined.Wallet
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.tiggey.wkly.presentation.theme.GlassBackground
import com.tiggey.wkly.presentation.theme.Primary

data class BottomNavItem(
    val route: String,
    val icon: ImageVector,
    val label: String
)

val bottomNavItems = listOf(
    BottomNavItem(NavRoutes.Dashboard.route, Icons.Outlined.Home, "Home"),
    BottomNavItem(NavRoutes.Budget.route, Icons.Outlined.Wallet, "Budget"),
    BottomNavItem(NavRoutes.Reports.route, Icons.Outlined.PieChart, "Reports"),
    BottomNavItem(NavRoutes.Profile.route, Icons.Outlined.Person, "Profile")
)

@Composable
fun WklyBottomNavigation(
    navController: NavController,
    onAddClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 16.dp)
    ) {
        // Bottom navigation bar
        NavigationBar(
            modifier = Modifier
                .fillMaxWidth()
                .clip(MaterialTheme.shapes.extraLarge),
            containerColor = GlassBackground,
            contentColor = MaterialTheme.colorScheme.onSurface
        ) {
            bottomNavItems.forEachIndexed { index, item ->
                // Add spacer in the middle for FAB
                if (index == 2) {
                    Spacer(modifier = Modifier.weight(1f))
                }

                NavigationBarItem(
                    icon = {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.label
                        )
                    },
                    label = { Text(item.label) },
                    selected = currentRoute == item.route,
                    onClick = {
                        if (currentRoute != item.route) {
                            navController.navigate(item.route) {
                                popUpTo(NavRoutes.Dashboard.route) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Primary,
                        selectedTextColor = Primary,
                        unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        indicatorColor = Primary.copy(alpha = 0.1f)
                    )
                )
            }
        }

        // FAB in the center
        FloatingActionButton(
            onClick = onAddClick,
            modifier = Modifier
                .align(Alignment.TopCenter)
                .offset(y = (-28).dp)
                .size(56.dp),
            shape = CircleShape,
            containerColor = Primary,
            contentColor = MaterialTheme.colorScheme.onPrimary
        ) {
            Icon(
                imageVector = Icons.Filled.Add,
                contentDescription = "Add Transaction"
            )
        }
    }
}
