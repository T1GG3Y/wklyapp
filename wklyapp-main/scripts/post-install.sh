#!/bin/bash

# Post-install script to set up Capacitor after npm install
# This should be run after: npm install

set -e

echo "🔧 Post-install setup for Capacitor..."

# Check if Capacitor is installed
if [ ! -d "node_modules/@capacitor" ]; then
  echo "❌ Capacitor not found. Please run 'npm install' first."
  exit 1
fi

# Initialize Capacitor if config doesn't exist
if [ ! -f "capacitor.config.ts" ]; then
  echo "⚡ Initializing Capacitor..."
  npx cap init "WKLY" "com.tiggey.wkly" --web-dir=out
  echo "✅ Capacitor initialized"
else
  echo "✅ Capacitor already configured"
fi

# Add Android platform if it doesn't exist
if [ ! -d "android" ]; then
  echo "📱 Adding Android platform..."
  npx cap add android
  echo "✅ Android platform added"
  
  # Configure Android build files
  echo "🔨 Configuring Android build files..."
  
  # Update project-level build.gradle
  if [ -f "android/build.gradle" ]; then
    if ! grep -q "google-services" android/build.gradle; then
      echo "Adding Google Services plugin to android/build.gradle..."
      # This will be done manually or via sed
    fi
  fi
  
  # Update app-level build.gradle
  if [ -f "android/app/build.gradle" ]; then
    if ! grep -q "com.google.gms.google-services" android/app/build.gradle; then
      echo "Note: You'll need to add 'apply plugin: \"com.google.gms.google-services\"' to android/app/build.gradle"
    fi
  fi
else
  echo "✅ Android platform already exists"
fi

# Copy google-services.json if it exists
if [ -f "../google-services.json" ]; then
  if [ -d "android/app" ]; then
    echo "📄 Copying google-services.json..."
    cp ../google-services.json android/app/google-services.json
    echo "✅ google-services.json copied"
  fi
elif [ -f "google-services.json" ]; then
  if [ -d "android/app" ]; then
    echo "📄 Copying google-services.json..."
    cp google-services.json android/app/google-services.json
    echo "✅ google-services.json copied"
  fi
fi

echo ""
echo "✅ Post-install setup complete!"
echo ""
echo "Next steps:"
echo "1. Build the app: npm run build"
echo "2. Sync Capacitor: npm run cap:sync"
echo "3. Configure Android build.gradle files (see CAPACITOR_SETUP.md)"
echo "4. Open in Android Studio: npm run cap:open"

