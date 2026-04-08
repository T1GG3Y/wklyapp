package com.tiggey.wkly.data.repository

import com.tiggey.wkly.data.model.Transaction
import kotlinx.coroutines.flow.Flow

interface TransactionRepository {
    fun getTransactions(uid: String, limit: Int? = null): Flow<List<Transaction>>
    fun getTransaction(uid: String, transactionId: String): Flow<Transaction?>
    suspend fun addTransaction(uid: String, transaction: Transaction): Result<String>
    suspend fun updateTransaction(uid: String, transactionId: String, transaction: Transaction): Result<Unit>
    suspend fun deleteTransaction(uid: String, transactionId: String): Result<Unit>
}
