# Capacitor Setup Guide for WKLY

This guide will help you set up Capacitor for Android deployment to the Google Play Store.

## Initial Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required Capacitor packages:
- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`
- `@capacitor/app`
- `@capacitor/haptics`
- `@capacitor/keyboard`
- `@capacitor/status-bar`

### Step 2: Initialize Capacitor

If not already done, initialize Capacitor:

```bash
npx cap init "WKLY" "com.tiggey.wkly" --web-dir=out
```

### Step 3: Add Android Platform

```bash
npx cap add android
```

### Step 4: Configure Firebase for Android

Copy your `google-services.json` file to the Android project:

```bash
cp /Users/tiger/Downloads/google-services.json android/app/google-services.json
```

Or use the provided script:
```bash
chmod +x scripts/copy-google-services.sh
./scripts/copy-google-services.sh
```

### Step 5: Update Android build.gradle

You need to add the Google Services plugin to your Android project.

1. Open `android/build.gradle` (project level)
2. Add to `dependencies`:
```gradle
classpath 'com.google.gms:google-services:4.4.0'
```

3. Open `android/app/build.gradle`
4. Add at the top (after other apply statements):
```gradle
apply plugin: 'com.google.gms.google-services'
```

### Step 6: Build and Sync

```bash
# Build the Next.js app
npm run build

# Sync with Capacitor
npx cap sync android
```

## Android Signing Configuration

To publish to Google Play Store, you need to sign your app.

### Option 1: Generate a New Keystore

```bash
keytool -genkey -v -keystore wkly-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias wkly
```

Store this file securely and **never commit it to version control**.

### Option 2: Configure Signing in build.gradle

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

Create `android/keystore.properties` (add to .gitignore!):
```properties
MYAPP_RELEASE_STORE_FILE=wkly-release-key.jks
MYAPP_RELEASE_STORE_PASSWORD=your-store-password
MYAPP_RELEASE_KEY_ALIAS=wkly
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

Then in `android/app/build.gradle`, add at the top:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

And update signingConfigs:
```gradle
signingConfigs {
    release {
        storeFile file(keystoreProperties['MYAPP_RELEASE_STORE_FILE'])
        storePassword keystoreProperties['MYAPP_RELEASE_STORE_PASSWORD']
        keyAlias keystoreProperties['MYAPP_RELEASE_KEY_ALIAS']
        keyPassword keystoreProperties['MYAPP_RELEASE_KEY_PASSWORD']
    }
}
```

## Building for Play Store

### Step 1: Build the Web App

```bash
npm run build
```

### Step 2: Sync Capacitor

```bash
npx cap sync android
```

### Step 3: Open in Android Studio

```bash
npx cap open android
```

### Step 4: Generate Signed Bundle

In Android Studio:
1. Build > Generate Signed Bundle / APK
2. Select "Android App Bundle" (required for Play Store)
3. Select your keystore and enter passwords
4. Choose "release" build variant
5. Click "Finish"

The AAB file will be created in `android/app/release/`

## Updating the App

After making changes to your Next.js app:

1. Build: `npm run build`
2. Sync: `npx cap sync android`
3. Rebuild in Android Studio or run: `npm run cap:run`

## Important Notes

- The app uses static export (`output: 'export'` in next.config.ts), so all pages must be statically generated
- Server-side features (API routes, server actions) won't work with static export
- Firebase client SDK works fine with static export
- Always test on a real device before publishing
- Keep your keystore file secure - losing it means you can't update your app

## Troubleshooting

### "google-services.json not found"
- Ensure the file is in `android/app/google-services.json`
- Check that the package name in the file matches `com.tiggey.wkly`

### Build errors
- Clean build: `cd android && ./gradlew clean`
- Delete `android/.gradle` and rebuild

### Sync issues
- Delete `android/app/src/main/assets/public`
- Run `npx cap sync android` again

### Firebase not working
- Verify `google-services.json` is in the correct location
- Check that Google Services plugin is applied in `build.gradle`
- Ensure Firebase dependencies are included

