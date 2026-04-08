# Android Build Configuration

After running `npx cap add android`, you need to configure the Android build files for Firebase and signing.

## 1. Project-level build.gradle

Edit `android/build.gradle` and add Google Services to the dependencies:

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
        classpath 'com.google.gms:google-services:4.4.0'  // Add this line
    }
}
```

## 2. App-level build.gradle

Edit `android/app/build.gradle`:

### Add Google Services plugin (at the top, after other apply statements):

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'  // Add this line
```

### Ensure minimum SDK and target SDK are set:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.tiggey.wkly"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    // ... rest of config
}
```

### Add signing configuration (for release builds):

Create `android/keystore.properties` (DO NOT commit this file!):
```properties
storeFile=../wkly-release-key.jks
storePassword=your-store-password
keyAlias=wkly
keyPassword=your-key-password
```

Then in `android/app/build.gradle`, add:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 3. Ensure google-services.json is in place

The `google-services.json` file should be at:
```
android/app/google-services.json
```

## 4. Generate Keystore (if you don't have one)

```bash
keytool -genkey -v -keystore android/wkly-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias wkly
```

**IMPORTANT**: 
- Store the keystore file securely
- Never commit it to version control
- Keep backups - losing it means you can't update your app on Play Store
- Store passwords securely

## 5. Update .gitignore

Ensure these are in `.gitignore`:
```
android/keystore.properties
android/*.jks
android/*.keystore
android/.gradle/
android/app/release/
android/app/debug/
```

