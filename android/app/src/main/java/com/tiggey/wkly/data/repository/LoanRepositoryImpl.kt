package com.tiggey.wkly.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.tiggey.wkly.data.model.Loan
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class LoanRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : LoanRepository {

    override fun getLoans(uid: String): Flow<List<Loan>> = callbackFlow {
        val listenerRegistration = firestore
            .collection("users")
            .document(uid)
            .collection("loans")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val loans = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(Loan::class.java)?.copy(id = doc.id)
                } ?: emptyList()

                trySend(loans)
            }

        awaitClose { listenerRegistration.remove() }
    }

    override suspend fun addLoan(uid: String, loan: Loan): Result<String> {
        return try {
            val docRef = firestore
                .collection("users")
                .document(uid)
                .collection("loans")
                .add(loan.copy(userProfileId = uid))
                .await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateLoan(uid: String, loanId: String, loan: Loan): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("loans")
                .document(loanId)
                .set(loan.copy(id = loanId, userProfileId = uid))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteLoan(uid: String, loanId: String): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .collection("loans")
                .document(loanId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
