package com.tiggey.wkly.data.repository

import com.tiggey.wkly.data.model.Loan
import kotlinx.coroutines.flow.Flow

interface LoanRepository {
    fun getLoans(uid: String): Flow<List<Loan>>
    suspend fun addLoan(uid: String, loan: Loan): Result<String>
    suspend fun updateLoan(uid: String, loanId: String, loan: Loan): Result<Unit>
    suspend fun deleteLoan(uid: String, loanId: String): Result<Unit>
}
