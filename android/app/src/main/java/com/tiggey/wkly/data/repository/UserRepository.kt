package com.tiggey.wkly.data.repository

import com.tiggey.wkly.data.model.User
import kotlinx.coroutines.flow.Flow

interface UserRepository {
    fun getUserProfile(uid: String): Flow<User?>
    suspend fun createUserProfile(uid: String, user: User): Result<Unit>
    suspend fun updateUserProfile(uid: String, updates: Map<String, Any>): Result<Unit>
    suspend fun deleteUserData(uid: String): Result<Unit>
}
