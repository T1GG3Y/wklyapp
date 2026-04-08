package com.tiggey.wkly.presentation.transaction

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.Timestamp
import com.tiggey.wkly.data.model.Transaction
import com.tiggey.wkly.data.repository.*
import com.tiggey.wkly.presentation.onboarding.discretionaryCategories
import com.tiggey.wkly.presentation.onboarding.requiredExpenseCategories
import com.tiggey.wkly.presentation.onboarding.savingsCategories
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TransactionViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val transactionRepository: TransactionRepository,
    private val discretionaryExpenseRepository: DiscretionaryExpenseRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TransactionUiState())
    val uiState: StateFlow<TransactionUiState> = _uiState.asStateFlow()

    init { loadCategories() }

    private fun loadCategories() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            discretionaryExpenseRepository.getDiscretionaryExpenses(uid).collect { expenses ->
                val categories = mutableListOf("Safe to Spend")
                categories.addAll(expenses.map { it.category })
                categories.addAll(requiredExpenseCategories)
                _uiState.update { it.copy(categories = categories.distinct()) }
            }
        }
    }

    fun setType(type: String) { _uiState.update { it.copy(type = type) } }
    fun setAmount(amount: String) { _uiState.update { it.copy(amount = amount) } }
    fun setCategory(category: String) { _uiState.update { it.copy(category = category) } }
    fun setDescription(description: String) { _uiState.update { it.copy(description = description) } }

    fun saveTransaction(finish: Boolean) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        val amount = _uiState.value.amount.toDoubleOrNull() ?: 0.0
        if (amount <= 0 || _uiState.value.category.isBlank()) {
            _uiState.update { it.copy(error = "Please enter amount and select category") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val transaction = Transaction(type = _uiState.value.type, amount = amount, date = Timestamp.now(), category = _uiState.value.category, description = _uiState.value.description)
            transactionRepository.addTransaction(uid, transaction)
                .onSuccess {
                    if (finish) _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                    else _uiState.update { TransactionUiState(categories = it.categories) }
                }
                .onFailure { e -> _uiState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }
}

data class TransactionUiState(
    val type: String = "Expense",
    val amount: String = "",
    val category: String = "Safe to Spend",
    val description: String = "",
    val categories: List<String> = listOf("Safe to Spend"),
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)
