package com.tiggey.wkly.data.repository

import com.tiggey.wkly.data.model.DiscretionaryExpense
import kotlinx.coroutines.flow.Flow

interface DiscretionaryExpenseRepository {
    fun getDiscretionaryExpenses(uid: String): Flow<List<DiscretionaryExpense>>
    suspend fun addDiscretionaryExpense(uid: String, expense: DiscretionaryExpense): Result<String>
    suspend fun updateDiscretionaryExpense(uid: String, expenseId: String, expense: DiscretionaryExpense): Result<Unit>
    suspend fun deleteDiscretionaryExpense(uid: String, expenseId: String): Result<Unit>
}
