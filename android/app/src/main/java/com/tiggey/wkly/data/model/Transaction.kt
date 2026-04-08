package com.tiggey.wkly.data.model

import com.google.firebase.Timestamp

data class Transaction(
    val id: String = "",
    val userProfileId: String = "",
    val type: String = "Expense",
    val amount: Double = 0.0,
    val date: Timestamp? = null,
    val category: String = "",
    val description: String = ""
) {
    val isIncome: Boolean
        get() = type == "Income"

    val isExpense: Boolean
        get() = type == "Expense"
}

enum class TransactionType(val value: String) {
    INCOME("Income"),
    EXPENSE("Expense");

    companion object {
        fun fromString(value: String): TransactionType {
            return entries.find { it.value == value } ?: EXPENSE
        }
    }
}
