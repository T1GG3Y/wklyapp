package com.tiggey.wkly.data.repository

import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    val currentUser: Flow<FirebaseUser?>
    val isEmailVerified: Boolean

    suspend fun signInWithEmailAndPassword(email: String, password: String): Result<FirebaseUser>
    suspend fun createUserWithEmailAndPassword(email: String, password: String): Result<FirebaseUser>
    suspend fun sendEmailVerification(): Result<Unit>
    suspend fun sendPasswordResetEmail(email: String): Result<Unit>
    suspend fun signOut()
    suspend fun deleteAccount(): Result<Unit>
    suspend fun updateProfile(displayName: String): Result<Unit>
    suspend fun reloadUser(): Result<Unit>
    fun getCurrentUser(): FirebaseUser?
}
