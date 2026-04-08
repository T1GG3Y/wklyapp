package com.tiggey.wkly.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.tiggey.wkly.data.model.Transaction
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class TransactionRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : TransactionRepository {

    override fun getTransactions(uid: String, limit: Int?): Flow<List<Transaction>> = callbackFlow {
        var query: Query = firestore
            .collection("users")
            .document(uid)
            .collection("transactions")
            .orderBy("date", Query.Direction.DESCENDING)

        if (limit != null) {
            query = query.limit(limit.toLong())
        }

        val listenerRegistration = query.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }

            val transactions = snapshot?.documents?.mapNotNull { doc ->
                doc.toObject(Transaction::class.java)?.copy(id = doc.id)
            } ?: emptyList()

            trySend(transactions)
        }

        awaitClose { listenerRegistration.remove() }
    }

    override fun getTransaction(uid: String, transactionId: String): Flow<Transaction?> = callbackFlow {
        val listenerRegistration = firestore
            .collection("users")
            .document(uid)
            .collection("transactions")
            .document(transactionId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val transaction = snapshot?.toObject(Transaction::class.java)?.copy(id = transactionId)
                trySend(transaction)
            }

        awaitClose { listenerRegistration.remove() }
    }

    override suspend fun addTransaction(uid: String, transaction: Transaction): Result<String> {
        return try {
            val docRef = firestore
                .collection("users")
                .document(uid)
                .collection("transactions")
                .add(transaction.copy(userProfileId = uid))
                .await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateTransaction(
        uid: String,
        transactionId: String,
        transaction: Transaction
    ): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("transactions")
                .document(transactionId)
                .set(transaction.copy(id = transactionId, userProfileId = uid))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteTransaction(uid: String, transactionId: String): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("transactions")
                .document(transactionId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
