package com.tiggey.wkly.data.model

data class RequiredExpense(
    val id: String = "",
    val userProfileId: String = "",
    val category: String = "",
    val amount: Double = 0.0,
    val frequency: String = "Monthly",
    val dueDate: String? = null
) {
    fun getFrequencyEnum(): Frequency = Frequency.fromString(frequency)
}
