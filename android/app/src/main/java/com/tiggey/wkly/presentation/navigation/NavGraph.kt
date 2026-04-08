package com.tiggey.wkly.presentation.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import com.tiggey.wkly.presentation.auth.*
import com.tiggey.wkly.presentation.budget.BudgetScreen
import com.tiggey.wkly.presentation.dashboard.DashboardScreen
import com.tiggey.wkly.presentation.onboarding.*
import com.tiggey.wkly.presentation.profile.HelpScreen
import com.tiggey.wkly.presentation.profile.PrivacyPolicyScreen
import com.tiggey.wkly.presentation.profile.ProfileScreen
import com.tiggey.wkly.presentation.reports.ReportDetailScreen
import com.tiggey.wkly.presentation.reports.ReportsListScreen
import com.tiggey.wkly.presentation.transaction.EditTransactionScreen
import com.tiggey.wkly.presentation.transaction.NewTransactionScreen

@Composable
fun WklyNavGraph(
    navController: NavHostController,
    mainViewModel: MainViewModel = hiltViewModel()
) {
    val authState by mainViewModel.authState.collectAsState()
    val userProfile by mainViewModel.userProfile.collectAsState()

    val startDestination = when {
        authState == AuthState.Loading -> NavRoutes.Login.route
        authState == AuthState.Unauthenticated -> NavRoutes.Login.route
        authState is AuthState.Authenticated && !(authState as AuthState.Authenticated).isEmailVerified -> NavRoutes.VerifyEmail.route
        userProfile?.onboardingComplete == false -> NavRoutes.OnboardingStartDay.route
        else -> NavRoutes.Dashboard.route
    }

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Determine if we should show bottom nav
    val showBottomNav = currentRoute in listOf(
        NavRoutes.Dashboard.route,
        NavRoutes.Budget.route,
        NavRoutes.Reports.route,
        NavRoutes.Profile.route
    )

    Scaffold(
        bottomBar = {
            if (showBottomNav) {
                WklyBottomNavigation(
                    navController = navController,
                    onAddClick = {
                        navController.navigate(NavRoutes.NewTransaction.route)
                    }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            NavHost(
                navController = navController,
                startDestination = startDestination
            ) {
                // Auth screens
                composable(NavRoutes.Login.route) {
                    LoginScreen(navController = navController)
                }
                composable(NavRoutes.SignUp.route) {
                    SignUpScreen(navController = navController)
                }
                composable(NavRoutes.ForgotPassword.route) {
                    ForgotPasswordScreen(navController = navController)
                }
                composable(NavRoutes.VerifyEmail.route) {
                    VerifyEmailScreen(navController = navController)
                }

                // Onboarding screens
                composable(NavRoutes.OnboardingStartDay.route) {
                    StartDayScreen(navController = navController)
                }
                composable(NavRoutes.OnboardingIncome.route) {
                    IncomeSetupScreen(navController = navController)
                }
                composable(NavRoutes.OnboardingRequiredExpenses.route) {
                    RequiredExpensesScreen(navController = navController)
                }
                composable(NavRoutes.OnboardingLoans.route) {
                    LoansSetupScreen(navController = navController)
                }
                composable(NavRoutes.OnboardingDiscretionary.route) {
                    DiscretionarySetupScreen(navController = navController)
                }
                composable(NavRoutes.OnboardingSavings.route) {
                    SavingsGoalsScreen(navController = navController)
                }
                composable(NavRoutes.OnboardingWeeklySummary.route) {
                    WeeklySummaryScreen(navController = navController)
                }

                // Main app screens
                composable(NavRoutes.Dashboard.route) {
                    DashboardScreen(navController = navController)
                }
                composable(NavRoutes.Budget.route) {
                    BudgetScreen(navController = navController)
                }
                composable(NavRoutes.Reports.route) {
                    ReportsListScreen(navController = navController)
                }
                composable(NavRoutes.Profile.route) {
                    ProfileScreen(navController = navController)
                }

                // Transaction screens
                composable(NavRoutes.NewTransaction.route) {
                    NewTransactionScreen(navController = navController)
                }
                composable(
                    route = NavRoutes.EditTransaction.route,
                    arguments = listOf(navArgument("transactionId") { type = NavType.StringType })
                ) { backStackEntry ->
                    val transactionId = backStackEntry.arguments?.getString("transactionId") ?: ""
                    EditTransactionScreen(
                        navController = navController,
                        transactionId = transactionId
                    )
                }

                // Report detail
                composable(
                    route = NavRoutes.ReportDetail.route,
                    arguments = listOf(navArgument("reportId") { type = NavType.StringType })
                ) { backStackEntry ->
                    val reportId = backStackEntry.arguments?.getString("reportId") ?: ""
                    ReportDetailScreen(
                        navController = navController,
                        reportId = reportId
                    )
                }

                // Profile sub-screens
                composable(NavRoutes.Help.route) {
                    HelpScreen(navController = navController)
                }
                composable(NavRoutes.PrivacyPolicy.route) {
                    PrivacyPolicyScreen(navController = navController)
                }

                // Budget edit screens (reuse onboarding screens)
                composable(NavRoutes.EditIncome.route) {
                    IncomeSetupScreen(navController = navController, isEditMode = true)
                }
                composable(NavRoutes.EditRequiredExpenses.route) {
                    RequiredExpensesScreen(navController = navController, isEditMode = true)
                }
                composable(NavRoutes.EditDiscretionary.route) {
                    DiscretionarySetupScreen(navController = navController, isEditMode = true)
                }
                composable(NavRoutes.EditLoans.route) {
                    LoansSetupScreen(navController = navController, isEditMode = true)
                }
                composable(NavRoutes.EditSavings.route) {
                    SavingsGoalsScreen(navController = navController, isEditMode = true)
                }
            }
        }
    }
}

sealed class AuthState {
    object Loading : AuthState()
    object Unauthenticated : AuthState()
    data class Authenticated(val uid: String, val isEmailVerified: Boolean) : AuthState()
}
