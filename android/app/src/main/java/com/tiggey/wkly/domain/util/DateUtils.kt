package com.tiggey.wkly.domain.util

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.TemporalAdjusters
import java.util.Date
import javax.inject.Inject

class DateUtils @Inject constructor() {

    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    private val displayFormatter = DateTimeFormatter.ofPattern("MMM d, yyyy")

    fun getStartOfWeek(date: LocalDate, startDay: DayOfWeek): LocalDate {
        return date.with(TemporalAdjusters.previousOrSame(startDay))
    }

    fun getEndOfWeek(startOfWeek: LocalDate): LocalDate {
        return startOfWeek.plusDays(6)
    }

    fun isWithinWeek(date: LocalDate, weekStart: LocalDate, weekEnd: LocalDate): Boolean {
        return !date.isBefore(weekStart) && !date.isAfter(weekEnd)
    }

    fun parseStartDayOfWeek(startDay: String): DayOfWeek {
        return when (startDay) {
            "Sunday" -> DayOfWeek.SUNDAY
            "Monday" -> DayOfWeek.MONDAY
            "Tuesday" -> DayOfWeek.TUESDAY
            "Wednesday" -> DayOfWeek.WEDNESDAY
            "Thursday" -> DayOfWeek.THURSDAY
            "Friday" -> DayOfWeek.FRIDAY
            "Saturday" -> DayOfWeek.SATURDAY
            else -> DayOfWeek.SUNDAY
        }
    }

    fun formatDate(date: LocalDate): String {
        return date.format(dateFormatter)
    }

    fun formatDisplayDate(date: LocalDate): String {
        return date.format(displayFormatter)
    }

    fun parseDate(dateString: String): LocalDate {
        return LocalDate.parse(dateString, dateFormatter)
    }

    fun toLocalDate(date: Date): LocalDate {
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate()
    }

    fun getCurrentWeekStart(startDay: String): LocalDate {
        val dayOfWeek = parseStartDayOfWeek(startDay)
        return getStartOfWeek(LocalDate.now(), dayOfWeek)
    }

    fun getCurrentWeekEnd(startDay: String): LocalDate {
        return getEndOfWeek(getCurrentWeekStart(startDay))
    }
}
