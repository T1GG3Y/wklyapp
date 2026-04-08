package com.tiggey.wkly.presentation.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.model.SavingsGoal
import com.tiggey.wkly.data.repository.AuthRepository
import com.tiggey.wkly.data.repository.SavingsGoalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SavingsGoalsViewModel @Inject constructor(private val authRepository: AuthRepository, private val repository: SavingsGoalRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(SavingsGoalsUiState())
    val uiState: StateFlow<SavingsGoalsUiState> = _uiState.asStateFlow()

    init { loadGoals() }

    private fun loadGoals() {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch { repository.getSavingsGoals(uid).collect { goals -> _uiState.update { it.copy(goals = goals, totalTarget = goals.sumOf { g -> g.targetAmount }, totalCurrent = goals.sumOf { g -> g.currentAmount }) } } }
    }

    fun addGoal(name: String, category: String, target: Double, current: Double) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch { repository.addSavingsGoal(uid, SavingsGoal(name = name, category = category, targetAmount = target, currentAmount = current)) }
    }

    fun deleteGoal(id: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return
        viewModelScope.launch { repository.deleteSavingsGoal(uid, id) }
    }
}

data class SavingsGoalsUiState(val goals: List<SavingsGoal> = emptyList(), val totalTarget: Double = 0.0, val totalCurrent: Double = 0.0)
