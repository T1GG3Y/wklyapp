# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# ============ General Rules ============
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations
-keepattributes EnclosingMethod

# ============ Firebase ============
# Firebase Auth
-keepclassmembers class * implements com.google.firebase.auth.FirebaseAuth$* {
    *;
}

# Firebase Firestore - keep model classes for serialization
-keep class com.google.firebase.firestore.** { *; }
-keep class com.tiggey.wkly.data.model.** { *; }
-keepclassmembers class com.tiggey.wkly.data.model.* {
    <init>();
    <fields>;
}

# Keep Timestamp class
-keep class com.google.firebase.Timestamp { *; }

# ============ Kotlin ============
# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# Kotlin Serialization (if used)
-keepattributes InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

# ============ Hilt / Dagger ============
-keepclasseswithmembers class * {
    @dagger.* <methods>;
}
-keep class dagger.* { *; }
-keep class javax.inject.* { *; }
-keep class * extends dagger.hilt.android.internal.managers.ComponentSupplier { *; }
-keep class * extends dagger.hilt.android.internal.managers.ViewComponentManager$FragmentContextWrapper { *; }

# ============ Jetpack Compose ============
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# ============ Navigation ============
-keepnames class * extends android.os.Parcelable
-keepnames class * extends java.io.Serializable
-keepnames class androidx.navigation.** { *; }

# ============ Vico Charts ============
-keep class com.patrykandpatrick.vico.** { *; }

# ============ OkHttp / Retrofit (Firebase dependencies) ============
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# ============ Remove Logging in Release ============
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
