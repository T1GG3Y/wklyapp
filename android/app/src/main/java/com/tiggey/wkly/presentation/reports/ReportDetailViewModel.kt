package com.tiggey.wkly.presentation.reports

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.repository.*
import com.tiggey.wkly.domain.util.DateUtils
import com.tiggey.wkly.presentation.navigation.NavRoutes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReportDetailViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository,
    private val transactionRepository: TransactionRepository,
    private val weeklySummaryRepository: WeeklySummaryRepository,
    private val dateUtils: DateUtils
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReportDetailUiState())
    val uiState: StateFlow<ReportDetailUiState> = _uiState.asStateFlow()

    fun loadReport(reportId: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return

        viewModelScope.launch {
            combine(userRepository.getUserProfile(uid), transactionRepository.getTransactions(uid)) { profile, transactions ->
                val startDay = profile?.startDayOfWeek ?: "Sunday"

                val (weekStart, weekEnd) = if (reportId == NavRoutes.ReportDetail.THIS_WEEK) {
                    Pair(dateUtils.getCurrentWeekStart(startDay), dateUtils.getCurrentWeekEnd(startDay))
                } else {
                    val summary = weeklySummaryRepository.getWeeklySummary(uid, reportId).first()
                    if (summary != null) Pair(dateUtils.parseDate(summary.weekStartDate), dateUtils.parseDate(summary.weekEndDate))
                    else Pair(dateUtils.getCurrentWeekStart(startDay), dateUtils.getCurrentWeekEnd(startDay))
                }

                val weekTransactions = transactions.filter { t ->
                    t.date?.toDate()?.let { date ->
                        val localDate = dateUtils.toLocalDate(date)
                        dateUtils.isWithinWeek(localDate, weekStart, weekEnd)
                    } ?: false
                }

                val totalIncome = weekTransactions.filter { it.isIncome }.sumOf { it.amount }
                val totalExpenses = weekTransactions.filter { it.isExpense }.sumOf { it.amount }

                val categoryBreakdown = weekTransactions.filter { it.isExpense }.groupBy { it.category }.mapValues { (_, txns) -> txns.sumOf { it.amount } }.toList().sortedByDescending { it.second }

                ReportDetailUiState(
                    weekStart = dateUtils.formatDisplayDate(weekStart),
                    weekEnd = dateUtils.formatDisplayDate(weekEnd),
                    totalIncome = totalIncome,
                    totalExpenses = totalExpenses,
                    categoryBreakdown = categoryBreakdown
                )
            }.collect { state -> _uiState.update { state } }
        }
    }
}

data class ReportDetailUiState(val weekStart: String = "", val weekEnd: String = "", val totalIncome: Double = 0.0, val totalExpenses: Double = 0.0, val categoryBreakdown: List<Pair<String, Double>> = emptyList())
