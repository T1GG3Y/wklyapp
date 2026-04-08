package com.tiggey.wkly.data.model

data class IncomeSource(
    val id: String = "",
    val userProfileId: String = "",
    val name: String = "",
    val amount: Double = 0.0,
    val frequency: String = "Monthly"
) {
    fun getFrequencyEnum(): Frequency = Frequency.fromString(frequency)
}
