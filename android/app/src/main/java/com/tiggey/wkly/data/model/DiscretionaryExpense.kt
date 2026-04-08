package com.tiggey.wkly.data.model

data class DiscretionaryExpense(
    val id: String = "",
    val userProfileId: String = "",
    val category: String = "",
    val plannedAmount: Double = 0.0
)
