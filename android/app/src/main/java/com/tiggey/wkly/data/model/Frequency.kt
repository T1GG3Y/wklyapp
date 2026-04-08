package com.tiggey.wkly.data.model

enum class Frequency(val value: String) {
    WEEKLY("Weekly"),
    BI_WEEKLY("Bi-weekly"),
    MONTHLY("Monthly"),
    YEARLY("Yearly");

    companion object {
        fun fromString(value: String): Frequency {
            return entries.find { it.value == value } ?: MONTHLY
        }
    }
}
