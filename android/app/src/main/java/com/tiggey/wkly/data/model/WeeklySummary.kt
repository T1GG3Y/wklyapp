package com.tiggey.wkly.data.model

data class WeeklySummary(
    val id: String = "",
    val weekStartDate: String = "",
    val weekEndDate: String = "",
    val totalIncome: Double = 0.0,
    val totalExpenses: Double = 0.0,
    val safeToSpendRollover: Double? = null,
    val needToSpendRollover: Double? = null,
    val createdAt: String? = null
)
