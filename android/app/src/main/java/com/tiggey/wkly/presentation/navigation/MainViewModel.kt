package com.tiggey.wkly.presentation.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.model.User
import com.tiggey.wkly.data.repository.AuthRepository
import com.tiggey.wkly.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _userProfile = MutableStateFlow<User?>(null)
    val userProfile: StateFlow<User?> = _userProfile.asStateFlow()

    init {
        observeAuthState()
    }

    private fun observeAuthState() {
        viewModelScope.launch {
            authRepository.currentUser.collect { firebaseUser ->
                if (firebaseUser == null) {
                    _authState.value = AuthState.Unauthenticated
                    _userProfile.value = null
                } else {
                    _authState.value = AuthState.Authenticated(
                        uid = firebaseUser.uid,
                        isEmailVerified = firebaseUser.isEmailVerified
                    )

                    // Load user profile
                    if (firebaseUser.isEmailVerified) {
                        userRepository.getUserProfile(firebaseUser.uid).collect { profile ->
                            _userProfile.value = profile
                        }
                    }
                }
            }
        }
    }
}
