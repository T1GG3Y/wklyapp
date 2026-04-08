package com.tiggey.wkly.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.tiggey.wkly.data.model.RequiredExpense
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class RequiredExpenseRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : RequiredExpenseRepository {

    override fun getRequiredExpenses(uid: String): Flow<List<RequiredExpense>> = callbackFlow {
        val listenerRegistration = firestore
            .collection("users")
            .document(uid)
            .collection("requiredExpenses")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val expenses = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(RequiredExpense::class.java)?.copy(id = doc.id)
                } ?: emptyList()

                trySend(expenses)
            }

        awaitClose { listenerRegistration.remove() }
    }

    override suspend fun addRequiredExpense(uid: String, expense: RequiredExpense): Result<String> {
        return try {
            val docRef = firestore
                .collection("users")
                .document(uid)
                .collection("requiredExpenses")
                .add(expense.copy(userProfileId = uid))
                .await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateRequiredExpense(
        uid: String,
        expenseId: String,
        expense: RequiredExpense
    ): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("requiredExpenses")
                .document(expenseId)
                .set(expense.copy(id = expenseId, userProfileId = uid))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteRequiredExpense(uid: String, expenseId: String): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("requiredExpenses")
                .document(expenseId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
