package com.tiggey.wkly.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.tiggey.wkly.data.model.IncomeSource
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class IncomeRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : IncomeRepository {

    override fun getIncomeSources(uid: String): Flow<List<IncomeSource>> = callbackFlow {
        val listenerRegistration = firestore
            .collection("users")
            .document(uid)
            .collection("incomeSources")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val sources = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(IncomeSource::class.java)?.copy(id = doc.id)
                } ?: emptyList()

                trySend(sources)
            }

        awaitClose { listenerRegistration.remove() }
    }

    override suspend fun addIncomeSource(uid: String, source: IncomeSource): Result<String> {
        return try {
            val docRef = firestore
                .collection("users")
                .document(uid)
                .collection("incomeSources")
                .add(source.copy(userProfileId = uid))
                .await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateIncomeSource(
        uid: String,
        sourceId: String,
        source: IncomeSource
    ): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("incomeSources")
                .document(sourceId)
                .set(source.copy(id = sourceId, userProfileId = uid))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteIncomeSource(uid: String, sourceId: String): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("incomeSources")
                .document(sourceId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
