package com.tiggey.wkly.presentation.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tiggey.wkly.data.model.IncomeSource
import com.tiggey.wkly.data.repository.AuthRepository
import com.tiggey.wkly.data.repository.IncomeRepository
import com.tiggey.wkly.domain.util.FrequencyConverter
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class IncomeSetupViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val incomeRepository: IncomeRepository,
    private val frequencyConverter: FrequencyConverter
) : ViewModel() {

    private val _uiState = MutableStateFlow(IncomeSetupUiState())
    val uiState: StateFlow<IncomeSetupUiState> = _uiState.asStateFlow()

    init {
        loadIncomeSources()
    }

    private fun loadIncomeSources() {
        val uid = authRepository.getCurrentUser()?.uid ?: return

        viewModelScope.launch {
            incomeRepository.getIncomeSources(uid).collect { sources ->
                val weeklyTotal = sources.sumOf {
                    frequencyConverter.toWeeklyAmount(it.amount, it.frequency)
                }
                val monthlyTotal = weeklyTotal * 4.33

                _uiState.update {
                    it.copy(
                        incomeSources = sources,
                        weeklyTotal = weeklyTotal,
                        monthlyTotal = monthlyTotal
                    )
                }
            }
        }
    }

    fun addIncomeSource(name: String, amount: Double, frequency: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return

        viewModelScope.launch {
            val source = IncomeSource(
                name = name,
                amount = amount,
                frequency = frequency
            )
            incomeRepository.addIncomeSource(uid, source)
        }
    }

    fun updateIncomeSource(id: String, name: String, amount: Double, frequency: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return

        viewModelScope.launch {
            val source = IncomeSource(
                id = id,
                name = name,
                amount = amount,
                frequency = frequency
            )
            incomeRepository.updateIncomeSource(uid, id, source)
        }
    }

    fun deleteIncomeSource(id: String) {
        val uid = authRepository.getCurrentUser()?.uid ?: return

        viewModelScope.launch {
            incomeRepository.deleteIncomeSource(uid, id)
        }
    }
}

data class IncomeSetupUiState(
    val incomeSources: List<IncomeSource> = emptyList(),
    val weeklyTotal: Double = 0.0,
    val monthlyTotal: Double = 0.0
)
