package com.tiggey.wkly.data.model

data class Loan(
    val id: String = "",
    val userProfileId: String = "",
    val name: String = "",
    val category: String = "",
    val totalBalance: Double = 0.0,
    val interestRate: Double? = null,
    val paymentFrequency: String = "Monthly"
) {
    fun getFrequencyEnum(): Frequency = Frequency.fromString(paymentFrequency)
}
