package com.tiggey.wkly.data.repository

import com.tiggey.wkly.data.model.SavingsGoal
import kotlinx.coroutines.flow.Flow

interface SavingsGoalRepository {
    fun getSavingsGoals(uid: String): Flow<List<SavingsGoal>>
    suspend fun addSavingsGoal(uid: String, goal: SavingsGoal): Result<String>
    suspend fun updateSavingsGoal(uid: String, goalId: String, goal: SavingsGoal): Result<Unit>
    suspend fun deleteSavingsGoal(uid: String, goalId: String): Result<Unit>
}
