# Quick Start Guide - Capacitor Setup

Follow these steps to get your app ready for the Google Play Store.

## Step 1: Install Dependencies

```bash
npm install
```

This installs all Capacitor packages and dependencies.

## Step 2: Initialize Capacitor (First Time Only)

```bash
# Option A: Use the setup script
chmod +x scripts/setup-capacitor.sh
./scripts/setup-capacitor.sh

# Option B: Manual setup
npx cap init "WKLY" "com.tiggey.wkly" --web-dir=out
npx cap add android
```

## Step 3: Copy google-services.json

```bash
# Copy from the Downloads folder
cp /Users/tiger/Downloads/google-services.json android/app/google-services.json

# Or use the script
chmod +x scripts/copy-google-services.sh
./scripts/copy-google-services.sh
```

## Step 4: Configure Android Build Files

You need to update two Gradle files. See `android-build-config.md` for detailed instructions.

**Quick version:**

1. Edit `android/build.gradle` - Add Google Services:
```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
}
```

2. Edit `android/app/build.gradle` - Add plugin at top:
```gradle
apply plugin: 'com.google.gms.google-services'
```

## Step 5: Build and Sync

```bash
# Build the Next.js app
npm run build

# Sync with Capacitor
npm run cap:sync
```

## Step 6: Open in Android Studio

```bash
npm run cap:open
```

## Step 7: Generate Signing Key (First Time Only)

```bash
keytool -genkey -v -keystore android/wkly-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias wkly
```

**Save the passwords securely!**

## Step 8: Configure Signing

1. Create `android/keystore.properties`:
```properties
storeFile=../wkly-release-key.jks
storePassword=your-store-password
keyAlias=wkly
keyPassword=your-key-password
```

2. Update `android/app/build.gradle` (see `android-build-config.md` for full code)

## Step 9: Build Release Bundle

In Android Studio:
1. Build > Generate Signed Bundle / APK
2. Select "Android App Bundle"
3. Choose your keystore
4. Select "release" variant
5. Build!

## Updating After Code Changes

```bash
npm run build          # Build Next.js app
npm run cap:sync       # Sync to Android
npm run cap:open       # Open in Android Studio (optional)
```

## Troubleshooting

- **Build fails?** Run `cd android && ./gradlew clean` then rebuild
- **google-services.json not found?** Ensure it's in `android/app/`
- **Sync issues?** Delete `android/app/src/main/assets/public` and sync again
- **Firebase not working?** Check that Google Services plugin is applied

For more details, see:
- `CAPACITOR_SETUP.md` - Complete setup guide
- `android-build-config.md` - Android configuration details
- `README.md` - General project information

