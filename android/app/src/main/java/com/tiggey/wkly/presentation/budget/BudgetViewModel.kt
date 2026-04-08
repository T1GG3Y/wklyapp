package com.tiggey.wkly.presentation.budget

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.model.*
import com.tiggey.wkly.data.repository.*
import com.tiggey.wkly.domain.util.FrequencyConverter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BudgetViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val incomeRepository: IncomeRepository,
    private val requiredExpenseRepository: RequiredExpenseRepository,
    private val discretionaryExpenseRepository: DiscretionaryExpenseRepository,
    private val loanRepository: LoanRepository,
    private val savingsGoalRepository: SavingsGoalRepository,
    private val frequencyConverter: FrequencyConverter
) : ViewModel() {

    private val _uiState = MutableStateFlow(BudgetUiState())
    val uiState: StateFlow<BudgetUiState> = _uiState.asStateFlow()

    init { loadBudget() }

    private fun loadBudget() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            combine(
                incomeRepository.getIncomeSources(uid),
                requiredExpenseRepository.getRequiredExpenses(uid),
                discretionaryExpenseRepository.getDiscretionaryExpenses(uid),
                loanRepository.getLoans(uid),
                savingsGoalRepository.getSavingsGoals(uid)
            ) { income, required, discretionary, loans, savings ->
                BudgetUiState(
                    incomeSources = income,
                    weeklyIncome = income.sumOf { frequencyConverter.toWeeklyAmount(it.amount, it.frequency) },
                    requiredExpenses = required,
                    weeklyRequired = required.sumOf { frequencyConverter.toWeeklyAmount(it.amount, it.frequency) },
                    discretionaryExpenses = discretionary,
                    weeklyDiscretionary = discretionary.sumOf { it.plannedAmount },
                    loans = loans,
                    totalDebt = loans.sumOf { it.totalBalance },
                    savingsGoals = savings,
                    totalSavings = savings.sumOf { it.targetAmount }
                )
            }.collect { state -> _uiState.update { state } }
        }
    }
}

data class BudgetUiState(
    val incomeSources: List<IncomeSource> = emptyList(),
    val weeklyIncome: Double = 0.0,
    val requiredExpenses: List<RequiredExpense> = emptyList(),
    val weeklyRequired: Double = 0.0,
    val discretionaryExpenses: List<DiscretionaryExpense> = emptyList(),
    val weeklyDiscretionary: Double = 0.0,
    val loans: List<Loan> = emptyList(),
    val totalDebt: Double = 0.0,
    val savingsGoals: List<SavingsGoal> = emptyList(),
    val totalSavings: Double = 0.0
)
