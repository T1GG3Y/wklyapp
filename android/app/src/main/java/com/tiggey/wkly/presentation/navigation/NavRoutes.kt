package com.tiggey.wkly.presentation.navigation

sealed class NavRoutes(val route: String) {
    // Auth Flow
    object Login : NavRoutes("login")
    object SignUp : NavRoutes("signup")
    object ForgotPassword : NavRoutes("forgot_password")
    object VerifyEmail : NavRoutes("verify_email")

    // Onboarding Flow
    object OnboardingStartDay : NavRoutes("onboarding/start_day")
    object OnboardingIncome : NavRoutes("onboarding/income")
    object OnboardingRequiredExpenses : NavRoutes("onboarding/required_expenses")
    object OnboardingLoans : NavRoutes("onboarding/loans")
    object OnboardingDiscretionary : NavRoutes("onboarding/discretionary")
    object OnboardingSavings : NavRoutes("onboarding/savings")
    object OnboardingWeeklySummary : NavRoutes("onboarding/weekly_summary")

    // Main App (Bottom Nav)
    object Dashboard : NavRoutes("dashboard")
    object Budget : NavRoutes("budget")
    object Reports : NavRoutes("reports")
    object Profile : NavRoutes("profile")

    // Transactions
    object NewTransaction : NavRoutes("transaction/new")
    object EditTransaction : NavRoutes("transaction/edit/{transactionId}") {
        fun createRoute(transactionId: String) = "transaction/edit/$transactionId"
    }

    // Report Detail
    object ReportDetail : NavRoutes("reports/{reportId}") {
        fun createRoute(reportId: String) = "reports/$reportId"
        const val THIS_WEEK = "this-week"
    }

    // Profile Sub-screens
    object Help : NavRoutes("help")
    object PrivacyPolicy : NavRoutes("privacy")

    // Budget Edit Screens
    object EditIncome : NavRoutes("budget/edit/income")
    object EditRequiredExpenses : NavRoutes("budget/edit/required")
    object EditDiscretionary : NavRoutes("budget/edit/discretionary")
    object EditLoans : NavRoutes("budget/edit/loans")
    object EditSavings : NavRoutes("budget/edit/savings")
}
