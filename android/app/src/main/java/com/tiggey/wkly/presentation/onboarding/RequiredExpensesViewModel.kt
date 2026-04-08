package com.tiggey.wkly.presentation.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.model.RequiredExpense
import com.tiggey.wkly.data.repository.AuthRepository
import com.tiggey.wkly.data.repository.RequiredExpenseRepository
import com.tiggey.wkly.domain.util.FrequencyConverter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RequiredExpensesViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val requiredExpenseRepository: RequiredExpenseRepository,
    private val frequencyConverter: FrequencyConverter
) : ViewModel() {

    private val _uiState = MutableStateFlow(RequiredExpensesUiState())
    val uiState: StateFlow<RequiredExpensesUiState> = _uiState.asStateFlow()

    init { loadExpenses() }

    private fun loadExpenses() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            requiredExpenseRepository.getRequiredExpenses(uid).collect { expenses ->
                val weeklyTotal = expenses.sumOf { frequencyConverter.toWeeklyAmount(it.amount, it.frequency) }
                _uiState.update { it.copy(expenses = expenses, weeklyTotal = weeklyTotal) }
            }
        }
    }

    fun addExpense(category: String, amount: Double, frequency: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            requiredExpenseRepository.addRequiredExpense(uid, RequiredExpense(category = category, amount = amount, frequency = frequency))
        }
    }

    fun updateExpense(id: String, category: String, amount: Double, frequency: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            requiredExpenseRepository.updateRequiredExpense(uid, id, RequiredExpense(id = id, category = category, amount = amount, frequency = frequency))
        }
    }

    fun deleteExpense(id: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch { requiredExpenseRepository.deleteRequiredExpense(uid, id) }
    }
}

data class RequiredExpensesUiState(val expenses: List<RequiredExpense> = emptyList(), val weeklyTotal: Double = 0.0)
