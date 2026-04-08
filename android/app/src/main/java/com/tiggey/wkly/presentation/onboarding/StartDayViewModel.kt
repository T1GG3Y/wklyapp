package com.tiggey.wkly.presentation.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.repository.AuthRepository
import com.tiggey.wkly.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class StartDayViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StartDayUiState())
    val uiState: StateFlow<StartDayUiState> = _uiState.asStateFlow()

    fun selectDay(day: String) {
        _uiState.update { it.copy(selectedDay = day, error = null) }
    }

    fun saveStartDay() {
        val day = _uiState.value.selectedDay ?: return
        val uid = authRepository.getCurrentUser()?.uid ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            userRepository.updateUserProfile(uid, mapOf("startDayOfWeek" to day))
                .onSuccess {
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                }
                .onFailure { exception ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Failed to save"
                        )
                    }
                }
        }
    }
}

data class StartDayUiState(
    val selectedDay: String? = "Sunday",
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)
