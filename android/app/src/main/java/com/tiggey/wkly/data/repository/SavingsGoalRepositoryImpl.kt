package com.tiggey.wkly.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.tiggey.wkly.data.model.SavingsGoal
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class SavingsGoalRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : SavingsGoalRepository {

    override fun getSavingsGoals(uid: String): Flow<List<SavingsGoal>> = callbackFlow {
        val listenerRegistration = firestore
            .collection("users")
            .document(uid)
            .collection("savingsGoals")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val goals = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(SavingsGoal::class.java)?.copy(id = doc.id)
                } ?: emptyList()

                trySend(goals)
            }

        awaitClose { listenerRegistration.remove() }
    }

    override suspend fun addSavingsGoal(uid: String, goal: SavingsGoal): Result<String> {
        return try {
            val docRef = firestore
                .collection("users")
                .document(uid)
                .collection("savingsGoals")
                .add(goal.copy(userProfileId = uid))
                .await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateSavingsGoal(uid: String, goalId: String, goal: SavingsGoal): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("savingsGoals")
                .document(goalId)
                .set(goal.copy(id = goalId, userProfileId = uid))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteSavingsGoal(uid: String, goalId: String): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("savingsGoals")
                .document(goalId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
