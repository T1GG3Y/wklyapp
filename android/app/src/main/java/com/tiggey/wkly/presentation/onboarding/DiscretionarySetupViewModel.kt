package com.tiggey.wkly.presentation.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.model.DiscretionaryExpense
import com.tiggey.wkly.data.repository.AuthRepository
import com.tiggey.wkly.data.repository.DiscretionaryExpenseRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DiscretionarySetupViewModel @Inject constructor(private val authRepository: AuthRepository, private val repository: DiscretionaryExpenseRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(DiscretionaryUiState())
    val uiState: StateFlow<DiscretionaryUiState> = _uiState.asStateFlow()

    init { loadExpenses() }

    private fun loadExpenses() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch { repository.getDiscretionaryExpenses(uid).collect { expenses -> _uiState.update { it.copy(expenses = expenses, weeklyTotal = expenses.sumOf { e -> e.plannedAmount }) } } }
    }

    fun setAmount(category: String, amount: Double) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        val existing = _uiState.value.expenses.find { it.category == category }
        viewModelScope.launch {
            if (existing != null) {
                if (amount > 0) repository.updateDiscretionaryExpense(uid, existing.id, DiscretionaryExpense(id = existing.id, category = category, plannedAmount = amount))
                else repository.deleteDiscretionaryExpense(uid, existing.id)
            } else if (amount > 0) {
                repository.addDiscretionaryExpense(uid, DiscretionaryExpense(category = category, plannedAmount = amount))
            }
        }
    }

    fun deleteExpense(category: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        val existing = _uiState.value.expenses.find { it.category == category } ?: return
        viewModelScope.launch { repository.deleteDiscretionaryExpense(uid, existing.id) }
    }
}

data class DiscretionaryUiState(val expenses: List<DiscretionaryExpense> = emptyList(), val weeklyTotal: Double = 0.0)
