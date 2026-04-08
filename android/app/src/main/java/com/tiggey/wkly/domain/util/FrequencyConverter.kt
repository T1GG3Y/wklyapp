package com.tiggey.wkly.domain.util

import com.tiggey.wkly.data.model.Frequency
import javax.inject.Inject

class FrequencyConverter @Inject constructor() {

    fun toWeeklyAmount(amount: Double, frequency: Frequency): Double {
        return when (frequency) {
            Frequency.WEEKLY -> amount
            Frequency.BI_WEEKLY -> amount / 2
            Frequency.MONTHLY -> amount / 4.33
            Frequency.YEARLY -> amount / 52
        }
    }

    fun toWeeklyAmount(amount: Double, frequencyString: String): Double {
        return toWeeklyAmount(amount, Frequency.fromString(frequencyString))
    }

    fun toMonthlyAmount(amount: Double, frequency: Frequency): Double {
        return when (frequency) {
            Frequency.WEEKLY -> amount * 4.33
            Frequency.BI_WEEKLY -> amount * 2.165
            Frequency.MONTHLY -> amount
            Frequency.YEARLY -> amount / 12
        }
    }

    fun toYearlyAmount(amount: Double, frequency: Frequency): Double {
        return when (frequency) {
            Frequency.WEEKLY -> amount * 52
            Frequency.BI_WEEKLY -> amount * 26
            Frequency.MONTHLY -> amount * 12
            Frequency.YEARLY -> amount
        }
    }
}
