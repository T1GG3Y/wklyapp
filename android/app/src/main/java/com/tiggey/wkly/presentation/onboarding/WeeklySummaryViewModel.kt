package com.tiggey.wkly.presentation.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.repository.*
import com.tiggey.wkly.domain.util.FrequencyConverter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class WeeklySummaryViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository,
    private val incomeRepository: IncomeRepository,
    private val requiredExpenseRepository: RequiredExpenseRepository,
    private val frequencyConverter: FrequencyConverter
) : ViewModel() {
    private val _uiState = MutableStateFlow(WeeklySummaryUiState())
    val uiState: StateFlow<WeeklySummaryUiState> = _uiState.asStateFlow()

    init { calculateBudget() }

    private fun calculateBudget() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            combine(incomeRepository.getIncomeSources(uid), requiredExpenseRepository.getRequiredExpenses(uid)) { income, expenses ->
                val weeklyIncome = income.sumOf { frequencyConverter.toWeeklyAmount(it.amount, it.frequency) }
                val weeklyExpenses = expenses.sumOf { frequencyConverter.toWeeklyAmount(it.amount, it.frequency) }
                WeeklySummaryUiState(weeklyIncome = weeklyIncome, weeklyExpenses = weeklyExpenses, safeToSpend = weeklyIncome - weeklyExpenses)
            }.collect { state -> _uiState.update { state } }
        }
    }

    fun completeOnboarding() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            userRepository.updateUserProfile(uid, mapOf("onboardingComplete" to true))
                .onSuccess { _uiState.update { it.copy(isLoading = false, isComplete = true) } }
                .onFailure { e -> _uiState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }
}

data class WeeklySummaryUiState(val weeklyIncome: Double = 0.0, val weeklyExpenses: Double = 0.0, val safeToSpend: Double = 0.0, val isLoading: Boolean = false, val isComplete: Boolean = false, val error: String? = null)
