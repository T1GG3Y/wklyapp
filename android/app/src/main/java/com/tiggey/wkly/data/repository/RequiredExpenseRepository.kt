package com.tiggey.wkly.data.repository

import com.tiggey.wkly.data.model.RequiredExpense
import kotlinx.coroutines.flow.Flow

interface RequiredExpenseRepository {
    fun getRequiredExpenses(uid: String): Flow<List<RequiredExpense>>
    suspend fun addRequiredExpense(uid: String, expense: RequiredExpense): Result<String>
    suspend fun updateRequiredExpense(uid: String, expenseId: String, expense: RequiredExpense): Result<Unit>
    suspend fun deleteRequiredExpense(uid: String, expenseId: String): Result<Unit>
}
