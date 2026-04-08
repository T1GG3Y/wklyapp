package com.tiggey.wkly.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.tiggey.wkly.data.model.WeeklySummary
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class WeeklySummaryRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : WeeklySummaryRepository {

    override fun getWeeklySummaries(uid: String, limit: Int?): Flow<List<WeeklySummary>> = callbackFlow {
        var query: Query = firestore
            .collection("users")
            .document(uid)
            .collection("weeklySummaries")
            .orderBy("weekStartDate", Query.Direction.DESCENDING)

        if (limit != null) {
            query = query.limit(limit.toLong())
        }

        val listenerRegistration = query.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }

            val summaries = snapshot?.documents?.mapNotNull { doc ->
                doc.toObject(WeeklySummary::class.java)?.copy(id = doc.id)
            } ?: emptyList()

            trySend(summaries)
        }

        awaitClose { listenerRegistration.remove() }
    }

    override fun getLatestSummary(uid: String): Flow<WeeklySummary?> = callbackFlow {
        val listenerRegistration = firestore
            .collection("users")
            .document(uid)
            .collection("weeklySummaries")
            .orderBy("weekStartDate", Query.Direction.DESCENDING)
            .limit(1)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val summary = snapshot?.documents?.firstOrNull()?.let { doc ->
                    doc.toObject(WeeklySummary::class.java)?.copy(id = doc.id)
                }
                trySend(summary)
            }

        awaitClose { listenerRegistration.remove() }
    }

    override fun getWeeklySummary(uid: String, summaryId: String): Flow<WeeklySummary?> = callbackFlow {
        val listenerRegistration = firestore
            .collection("users")
            .document(uid)
            .collection("weeklySummaries")
            .document(summaryId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val summary = snapshot?.toObject(WeeklySummary::class.java)?.copy(id = summaryId)
                trySend(summary)
            }

        awaitClose { listenerRegistration.remove() }
    }

    override suspend fun createWeeklySummary(
        uid: String,
        summaryId: String,
        summary: WeeklySummary
    ): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("weeklySummaries")
                .document(summaryId)
                .set(summary.copy(id = summaryId))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateWeeklySummary(
        uid: String,
        summaryId: String,
        summary: WeeklySummary
    ): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("weeklySummaries")
                .document(summaryId)
                .set(summary.copy(id = summaryId))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
