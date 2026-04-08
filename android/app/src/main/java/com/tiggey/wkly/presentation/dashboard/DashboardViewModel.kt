package com.tiggey.wkly.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.model.Transaction
import com.tiggey.wkly.data.repository.*
import com.tiggey.wkly.domain.util.DateUtils
import com.tiggey.wkly.domain.util.FrequencyConverter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository,
    private val incomeRepository: IncomeRepository,
    private val requiredExpenseRepository: RequiredExpenseRepository,
    private val discretionaryExpenseRepository: DiscretionaryExpenseRepository,
    private val transactionRepository: TransactionRepository,
    private val weeklySummaryRepository: WeeklySummaryRepository,
    private val frequencyConverter: FrequencyConverter,
    private val dateUtils: DateUtils
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init { loadDashboard() }

    private fun loadDashboard() {
        val uid = authRepository.getCurrentUser()?.uid ?: return

        viewModelScope.launch {
            // Combine first 5 flows
            val firstCombine = combine(
                userRepository.getUserProfile(uid),
                incomeRepository.getIncomeSources(uid),
                requiredExpenseRepository.getRequiredExpenses(uid),
                discretionaryExpenseRepository.getDiscretionaryExpenses(uid),
                transactionRepository.getTransactions(uid, 15)
            ) { profile, income, required, discretionary, transactions ->
                DashboardData(profile, income, required, discretionary, transactions)
            }

            // Combine with the 6th flow
            combine(
                firstCombine,
                weeklySummaryRepository.getLatestSummary(uid)
            ) { data, lastSummary ->
                val startDay = data.profile?.startDayOfWeek ?: "Sunday"
                val weekStart = dateUtils.getCurrentWeekStart(startDay)
                val weekEnd = dateUtils.getCurrentWeekEnd(startDay)

                val safeToSpendRollover = lastSummary?.safeToSpendRollover ?: 0.0
                val needToSpendRollover = lastSummary?.needToSpendRollover ?: 0.0

                val weeklyIncome = data.income.sumOf { frequencyConverter.toWeeklyAmount(it.amount, it.frequency) }
                val weeklyRequired = data.required.sumOf { frequencyConverter.toWeeklyAmount(it.amount, it.frequency) }
                val weeklyDiscretionary = data.discretionary.sumOf { it.plannedAmount }

                val totalSafeToSpend = (weeklyIncome - weeklyRequired) + safeToSpendRollover
                val totalNeedToSpend = weeklyDiscretionary + needToSpendRollover

                val discretionaryCategories = data.discretionary.map { it.category }
                val weeklyTransactions = data.transactions.filter { t ->
                    t.date?.toDate()?.let { date ->
                        val localDate = dateUtils.toLocalDate(date)
                        dateUtils.isWithinWeek(localDate, weekStart, weekEnd)
                    } ?: false
                }

                var safeToSpendSpent = 0.0
                var needToSpendSpent = 0.0
                for (t in weeklyTransactions) {
                    if (t.isExpense) {
                        if (discretionaryCategories.contains(t.category)) needToSpendSpent += t.amount
                        else if (t.category == "Safe to Spend") safeToSpendSpent += t.amount
                    }
                }

                val remainingSafeToSpend = totalSafeToSpend - safeToSpendSpent
                val remainingNeedToSpend = totalNeedToSpend - needToSpendSpent

                DashboardUiState(
                    isLoading = false,
                    totalSafeToSpend = totalSafeToSpend,
                    remainingSafeToSpend = remainingSafeToSpend,
                    safeToSpendProgress = if (totalSafeToSpend > 0) (safeToSpendSpent / totalSafeToSpend).toFloat().coerceIn(0f, 1f) else 0f,
                    safeToSpendRollover = safeToSpendRollover,
                    totalNeedToSpend = totalNeedToSpend,
                    remainingNeedToSpend = remainingNeedToSpend,
                    needToSpendProgress = if (totalNeedToSpend > 0) (needToSpendSpent / totalNeedToSpend).toFloat().coerceIn(0f, 1f) else 0f,
                    needToSpendRollover = needToSpendRollover,
                    transactions = data.transactions
                )
            }.collect { state -> _uiState.update { state } }
        }
    }

    private data class DashboardData(
        val profile: com.tiggey.wkly.data.model.User?,
        val income: List<com.tiggey.wkly.data.model.IncomeSource>,
        val required: List<com.tiggey.wkly.data.model.RequiredExpense>,
        val discretionary: List<com.tiggey.wkly.data.model.DiscretionaryExpense>,
        val transactions: List<Transaction>
    )
}

data class DashboardUiState(
    val isLoading: Boolean = true,
    val totalSafeToSpend: Double = 0.0,
    val remainingSafeToSpend: Double = 0.0,
    val safeToSpendProgress: Float = 0f,
    val safeToSpendRollover: Double = 0.0,
    val totalNeedToSpend: Double = 0.0,
    val remainingNeedToSpend: Double = 0.0,
    val needToSpendProgress: Float = 0f,
    val needToSpendRollover: Double = 0.0,
    val transactions: List<Transaction> = emptyList()
)
