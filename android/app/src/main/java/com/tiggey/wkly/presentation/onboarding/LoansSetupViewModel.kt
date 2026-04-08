package com.tiggey.wkly.presentation.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.model.Loan
import com.tiggey.wkly.data.repository.AuthRepository
import com.tiggey.wkly.data.repository.LoanRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoansSetupViewModel @Inject constructor(private val authRepository: AuthRepository, private val loanRepository: LoanRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(LoansUiState())
    val uiState: StateFlow<LoansUiState> = _uiState.asStateFlow()

    init { loadLoans() }

    private fun loadLoans() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch { loanRepository.getLoans(uid).collect { loans -> _uiState.update { it.copy(loans = loans, totalDebt = loans.sumOf { l -> l.totalBalance }) } } }
    }

    fun addLoan(name: String, category: String, balance: Double) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch { loanRepository.addLoan(uid, Loan(name = name, category = category, totalBalance = balance)) }
    }

    fun deleteLoan(id: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch { loanRepository.deleteLoan(uid, id) }
    }
}

data class LoansUiState(val loans: List<Loan> = emptyList(), val totalDebt: Double = 0.0)
