package com.tiggey.wkly.presentation.reports

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.model.WeeklySummary
import com.tiggey.wkly.data.repository.*
import com.tiggey.wkly.domain.util.DateUtils
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReportsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository,
    private val transactionRepository: TransactionRepository,
    private val weeklySummaryRepository: WeeklySummaryRepository,
    private val dateUtils: DateUtils
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReportsUiState())
    val uiState: StateFlow<ReportsUiState> = _uiState.asStateFlow()

    init { loadReports() }

    private fun loadReports() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            combine(
                userRepository.getUserProfile(uid),
                transactionRepository.getTransactions(uid),
                weeklySummaryRepository.getWeeklySummaries(uid)
            ) { profile, transactions, summaries ->
                val startDay = profile?.startDayOfWeek ?: "Sunday"
                val weekStart = dateUtils.getCurrentWeekStart(startDay)
                val weekEnd = dateUtils.getCurrentWeekEnd(startDay)

                val currentWeekTransactions = transactions.filter { t ->
                    t.date?.toDate()?.let { date ->
                        val localDate = dateUtils.toLocalDate(date)
                        dateUtils.isWithinWeek(localDate, weekStart, weekEnd)
                    } ?: false
                }

                val income = currentWeekTransactions.filter { it.isIncome }.sumOf { it.amount }
                val expenses = currentWeekTransactions.filter { it.isExpense }.sumOf { it.amount }

                ReportsUiState(currentWeekIncome = income, currentWeekExpenses = expenses, summaries = summaries)
            }.collect { state -> _uiState.update { state } }
        }
    }
}

data class ReportsUiState(val currentWeekIncome: Double = 0.0, val currentWeekExpenses: Double = 0.0, val summaries: List<WeeklySummary> = emptyList())
