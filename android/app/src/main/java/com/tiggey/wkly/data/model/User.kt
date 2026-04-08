package com.tiggey.wkly.data.model

data class User(
    val id: String = "",
    val email: String = "",
    val displayName: String? = null,
    val photoURL: String? = null,
    val startDayOfWeek: String = "Sunday",
    val onboardingComplete: Boolean = false
)
