package com.tiggey.wkly.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.tiggey.wkly.data.model.DiscretionaryExpense
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class DiscretionaryExpenseRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : DiscretionaryExpenseRepository {

    override fun getDiscretionaryExpenses(uid: String): Flow<List<DiscretionaryExpense>> = callbackFlow {
        val listenerRegistration = firestore
            .collection("users")
            .document(uid)
            .collection("discretionaryExpenses")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val expenses = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(DiscretionaryExpense::class.java)?.copy(id = doc.id)
                } ?: emptyList()

                trySend(expenses)
            }

        awaitClose { listenerRegistration.remove() }
    }

    override suspend fun addDiscretionaryExpense(uid: String, expense: DiscretionaryExpense): Result<String> {
        return try {
            val docRef = firestore
                .collection("users")
                .document(uid)
                .collection("discretionaryExpenses")
                .add(expense.copy(userProfileId = uid))
                .await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateDiscretionaryExpense(
        uid: String,
        expenseId: String,
        expense: DiscretionaryExpense
    ): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("discretionaryExpenses")
                .document(expenseId)
                .set(expense.copy(id = expenseId, userProfileId = uid))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteDiscretionaryExpense(uid: String, expenseId: String): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("discretionaryExpenses")
                .document(expenseId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
