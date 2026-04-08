package com.tiggey.wkly.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.tiggey.wkly.data.model.User
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

class UserRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : UserRepository {

    override fun getUserProfile(uid: String): Flow<User?> = callbackFlow {
        val listenerRegistration = firestore
            .collection("users")
            .document(uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }

                val user = snapshot?.toObject(User::class.java)?.copy(id = uid)
                trySend(user)
            }

        awaitClose { listenerRegistration.remove() }
    }

    override suspend fun createUserProfile(uid: String, user: User): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .set(user.copy(id = uid))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateUserProfile(uid: String, updates: Map<String, Any>): Result<Unit> {
        return try {
            firestore
                .collection("users")
                .document(uid)
                .update(updates)
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteUserData(uid: String): Result<Unit> {
        return try {
            // Delete all subcollections first
            val collections = listOf(
                "incomeSources", "requiredExpenses", "discretionaryExpenses",
                "loans", "savingsGoals", "transactions", "weeklySummaries"
            )

            for (collectionName in collections) {
                val docs = firestore
                    .collection("users")
                    .document(uid)
                    .collection(collectionName)
                    .get()
                    .await()

                for (doc in docs) {
                    doc.reference.delete().await()
                }
            }

            // Delete user document
            firestore.collection("users").document(uid).delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
