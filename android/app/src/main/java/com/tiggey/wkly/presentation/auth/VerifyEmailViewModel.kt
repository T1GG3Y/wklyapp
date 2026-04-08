package com.tiggey.wkly.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.tiggey.wkly.data.repository.AuthRepository
import com.tiggey.wkly.presentation.navigation.NavRoutes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class VerifyEmailViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(VerifyEmailUiState())
    val uiState: StateFlow<VerifyEmailUiState> = _uiState.asStateFlow()

    fun checkVerification() {
        viewModelScope.launch {
            _uiState.update { it.copy(isChecking = true, error = null) }

            authRepository.reloadUser()
                .onSuccess {
                    val user = authRepository.getCurrentUser()
                    if (user?.isEmailVerified == true) {
                        _uiState.update { it.copy(isChecking = false, isVerified = true) }
                    } else {
                        _uiState.update {
                            it.copy(
                                isChecking = false,
                                error = "Email not verified yet. Please check your inbox."
                            )
                        }
                    }
                }
                .onFailure { exception ->
                    _uiState.update {
                        it.copy(
                            isChecking = false,
                            error = exception.message ?: "Failed to check verification"
                        )
                    }
                }
        }
    }

    fun resendVerificationEmail() {
        viewModelScope.launch {
            _uiState.update { it.copy(isResending = true, error = null, resendSuccess = false) }

            authRepository.sendEmailVerification()
                .onSuccess {
                    _uiState.update { it.copy(isResending = false, resendSuccess = true) }
                }
                .onFailure { exception ->
                    _uiState.update {
                        it.copy(
                            isResending = false,
                            error = exception.message ?: "Failed to send verification email"
                        )
                    }
                }
        }
    }

    fun signOut(navController: NavController) {
        viewModelScope.launch {
            authRepository.signOut()
            navController.navigate(NavRoutes.Login.route) {
                popUpTo(0) { inclusive = true }
            }
        }
    }
}

data class VerifyEmailUiState(
    val isChecking: Boolean = false,
    val isResending: Boolean = false,
    val isVerified: Boolean = false,
    val resendSuccess: Boolean = false,
    val error: String? = null
)
