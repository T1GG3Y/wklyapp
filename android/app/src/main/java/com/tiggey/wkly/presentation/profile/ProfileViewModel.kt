package com.tiggey.wkly.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.repository.AuthRepository
import com.tiggey.wkly.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init { loadProfile() }

    private fun loadProfile() {
        val user = authRepository.getCurrentUser()
        if (user != null) {
            _uiState.update { it.copy(email = user.email ?: "", displayName = user.displayName ?: "") }

            viewModelScope.launch {
                userRepository.getUserProfile(user.uid).collect { profile ->
                    _uiState.update { it.copy(displayName = profile?.displayName ?: user.displayName ?: "") }
                }
            }
        }
    }

    fun updateName(name: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            authRepository.updateProfile(name)
            userRepository.updateUserProfile(uid, mapOf("displayName" to name))
            _uiState.update { it.copy(displayName = name) }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
            _uiState.update { it.copy(isSignedOut = true) }
        }
    }

    fun deleteAccount() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch {
            userRepository.deleteUserData(uid)
            authRepository.deleteAccount()
            _uiState.update { it.copy(isSignedOut = true) }
        }
    }
}

data class ProfileUiState(val email: String = "", val displayName: String = "", val isSignedOut: Boolean = false)
