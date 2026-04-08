package com.tiggey.wkly.di

import com.tiggey.wkly.domain.util.CurrencyFormatter
import com.tiggey.wkly.domain.util.DateUtils
import com.tiggey.wkly.domain.util.FrequencyConverter
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideFrequencyConverter(): FrequencyConverter = FrequencyConverter()

    @Provides
    @Singleton
    fun provideDateUtils(): DateUtils = DateUtils()

    @Provides
    @Singleton
    fun provideCurrencyFormatter(): CurrencyFormatter = CurrencyFormatter()
}
