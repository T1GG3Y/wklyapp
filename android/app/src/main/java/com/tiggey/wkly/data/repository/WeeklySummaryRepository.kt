package com.tiggey.wkly.data.repository

import com.tiggey.wkly.data.model.WeeklySummary
import kotlinx.coroutines.flow.Flow

interface WeeklySummaryRepository {
    fun getWeeklySummaries(uid: String, limit: Int? = null): Flow<List<WeeklySummary>>
    fun getLatestSummary(uid: String): Flow<WeeklySummary?>
    fun getWeeklySummary(uid: String, summaryId: String): Flow<WeeklySummary?>
    suspend fun createWeeklySummary(uid: String, summaryId: String, summary: WeeklySummary): Result<Unit>
    suspend fun updateWeeklySummary(uid: String, summaryId: String, summary: WeeklySummary): Result<Unit>
}
