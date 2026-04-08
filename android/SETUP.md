# WKLY Android App - Setup Instructions

## Prerequisites

1. **Android Studio** (Installed at `/Applications/Android Studio.app`)
2. **Android SDK** (needs to be installed via Android Studio)
3. **JDK** (bundled with Android Studio)

## Step 1: Install Android SDK

1. Open Android Studio
2. Go to **Settings/Preferences > Languages & Frameworks > Android SDK**
3. Install the following:
   - **SDK Platforms**: Android 14 (API 35)
   - **SDK Tools**:
     - Android SDK Build-Tools 35
     - Android SDK Platform-Tools
     - Android Emulator (optional, for testing)

## Step 2: Configure local.properties

After installing the SDK, create `local.properties` in the `android/` directory:

```properties
sdk.dir=/Users/tiger/Library/Android/sdk
```

## Step 3: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project: `studio-8976664643-fedc8`
3. Click **Project settings** (gear icon)
4. Under **Your apps**, click **Add app > Android**
5. Enter package name: `com.wkly.app`
6. Download `google-services.json`
7. Place it in `android/app/google-services.json` (replace the placeholder)

## Step 4: Generate Release Keystore (for Play Store)

Generate a new keystore for signing your release build:

```bash
keytool -genkey -v -keystore wkly-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias wkly
```

Then create `keystore.properties` in the `android/` directory:

```properties
storeFile=wkly-release-key.jks
storePassword=your_keystore_password
keyAlias=wkly
keyPassword=your_key_password
```

**Important**: Never commit `keystore.properties` or `.jks` files to git!

## Step 5: Build the App

### Debug Build (for testing)
```bash
cd android
./gradlew assembleDebug
```
Output: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build (for Play Store)
```bash
cd android
./gradlew bundleRelease
```
Output: `app/build/outputs/bundle/release/app-release.aab`

## Building from Android Studio

1. Open the `android/` directory in Android Studio
2. Wait for Gradle sync to complete
3. For Debug: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
4. For Release: **Build > Generate Signed Bundle / APK**

## Troubleshooting

### "SDK location not found"
Create `local.properties` with your SDK path (see Step 2).

### "google-services.json not found"
Download from Firebase Console (see Step 3).

### "Keystore file not found" (release build)
Create a keystore and `keystore.properties` (see Step 4).

### Build errors after opening in Android Studio
1. File > Sync Project with Gradle Files
2. Build > Clean Project
3. Build > Rebuild Project
