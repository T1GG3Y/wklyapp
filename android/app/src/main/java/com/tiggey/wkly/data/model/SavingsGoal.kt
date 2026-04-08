package com.tiggey.wkly.data.model

data class SavingsGoal(
    val id: String = "",
    val userProfileId: String = "",
    val name: String = "",
    val category: String = "",
    val targetAmount: Double = 0.0,
    val currentAmount: Double = 0.0
) {
    val progress: Float
        get() = if (targetAmount > 0) (currentAmount / targetAmount).toFloat().coerceIn(0f, 1f) else 0f
}
