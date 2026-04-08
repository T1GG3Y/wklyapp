#!/bin/bash

# Setup script for Capacitor Android
# This script initializes Capacitor and sets up the Android project

set -e

echo "🚀 Setting up Capacitor for Android..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Initialize Capacitor if not already initialized
if [ ! -f "capacitor.config.ts" ]; then
  echo "⚡ Initializing Capacitor..."
  npx cap init "WKLY" "com.tiggey.wkly" --web-dir=out
else
  echo "✅ Capacitor already initialized"
fi

# Add Android platform if it doesn't exist
if [ ! -d "android" ]; then
  echo "📱 Adding Android platform..."
  npx cap add android
else
  echo "✅ Android platform already exists"
fi

# Copy google-services.json to Android app directory
if [ -f "../google-services.json" ]; then
  echo "📄 Copying google-services.json to Android project..."
  cp ../google-services.json android/app/google-services.json
  echo "✅ google-services.json copied"
elif [ -f "google-services.json" ]; then
  echo "📄 Copying google-services.json to Android project..."
  cp google-services.json android/app/google-services.json
  echo "✅ google-services.json copied"
else
  echo "⚠️  Warning: google-services.json not found. Please copy it manually to android/app/google-services.json"
fi

# Build the Next.js app
echo "🔨 Building Next.js app..."
npm run build

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync android

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Configure your signing key in android/app/build.gradle"
echo "3. Build and run your app"

