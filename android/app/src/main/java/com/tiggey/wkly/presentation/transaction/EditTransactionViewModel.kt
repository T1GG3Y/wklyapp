package com.tiggey.wkly.presentation.transaction

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.Timestamp
import com.tiggey.wkly.data.model.Transaction
import com.tiggey.wkly.data.repository.*
import com.tiggey.wkly.presentation.onboarding.requiredExpenseCategories
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class EditTransactionViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val transactionRepository: TransactionRepository,
    private val discretionaryExpenseRepository: DiscretionaryExpenseRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(EditTransactionUiState())
    val uiState: StateFlow<EditTransactionUiState> = _uiState.asStateFlow()
    private var transactionId: String = ""
    private var originalDate: Timestamp? = null

    fun loadTransaction(id: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        transactionId = id

        viewModelScope.launch {
            // Load categories
            discretionaryExpenseRepository.getDiscretionaryExpenses(uid).first().let { expenses ->
                val categories = mutableListOf("Safe to Spend")
                categories.addAll(expenses.map { it.category })
                categories.addAll(requiredExpenseCategories)
                _uiState.update { it.copy(categories = categories.distinct()) }
            }

            // Load transaction
            transactionRepository.getTransaction(uid, id).collect { transaction ->
                if (transaction != null) {
                    originalDate = transaction.date
                    _uiState.update { it.copy(type = transaction.type, amount = transaction.amount.toString(), category = transaction.category, description = transaction.description) }
                }
            }
        }
    }

    fun setType(type: String) { _uiState.update { it.copy(type = type) } }
    fun setAmount(amount: String) { _uiState.update { it.copy(amount = amount) } }
    fun setCategory(category: String) { _uiState.update { it.copy(category = category) } }
    fun setDescription(description: String) { _uiState.update { it.copy(description = description) } }

    fun updateTransaction() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        val amount = _uiState.value.amount.toDoubleOrNull() ?: 0.0
        if (amount <= 0) { _uiState.update { it.copy(error = "Please enter a valid amount") }; return }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val transaction = Transaction(id = transactionId, type = _uiState.value.type, amount = amount, date = originalDate, category = _uiState.value.category, description = _uiState.value.description)
            transactionRepository.updateTransaction(uid, transactionId, transaction)
                .onSuccess { _uiState.update { it.copy(isLoading = false, isSuccess = true) } }
                .onFailure { e -> _uiState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun deleteTransaction() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            transactionRepository.deleteTransaction(uid, transactionId)
            _uiState.update { it.copy(isSuccess = true) }
        }
    }
}

data class EditTransactionUiState(val type: String = "Expense", val amount: String = "", val category: String = "", val description: String = "", val categories: List<String> = emptyList(), val isLoading: Boolean = false, val isSuccess: Boolean = false, val error: String? = null)
