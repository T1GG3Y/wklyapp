package com.tiggey.wkly.domain.util

import java.text.NumberFormat
import java.util.Locale
import javax.inject.Inject

class CurrencyFormatter @Inject constructor() {

    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    private val numberFormat = NumberFormat.getNumberInstance(Locale.US).apply {
        minimumFractionDigits = 2
        maximumFractionDigits = 2
    }

    fun format(amount: Double): String {
        return currencyFormat.format(amount)
    }

    fun formatWithoutSymbol(amount: Double): String {
        return numberFormat.format(amount)
    }

    fun formatCompact(amount: Double): String {
        return if (amount >= 1000) {
            String.format(Locale.US, "$%.1fk", amount / 1000)
        } else {
            String.format(Locale.US, "$%.0f", amount)
        }
    }

    fun formatInteger(amount: Double): String {
        return String.format(Locale.US, "$%.0f", amount)
    }
}
