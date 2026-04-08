package com.tiggey.wkly.data.repository

import com.tiggey.wkly.data.model.IncomeSource
import kotlinx.coroutines.flow.Flow

interface IncomeRepository {
    fun getIncomeSources(uid: String): Flow<List<IncomeSource>>
    suspend fun addIncomeSource(uid: String, source: IncomeSource): Result<String>
    suspend fun updateIncomeSource(uid: String, sourceId: String, source: IncomeSource): Result<Unit>
    suspend fun deleteIncomeSource(uid: String, sourceId: String): Result<Unit>
}
