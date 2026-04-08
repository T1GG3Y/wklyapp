#!/bin/bash

# Script to copy google-services.json to Android project

set -e

GOOGLE_SERVICES_SOURCE="../google-services.json"
GOOGLE_SERVICES_DEST="android/app/google-services.json"

if [ ! -f "$GOOGLE_SERVICES_SOURCE" ]; then
  # Try alternative location
  GOOGLE_SERVICES_SOURCE="google-services.json"
fi

if [ ! -f "$GOOGLE_SERVICES_SOURCE" ]; then
  echo "❌ Error: google-services.json not found"
  echo "Please ensure google-services.json is in the project root or parent directory"
  exit 1
fi

if [ ! -d "android/app" ]; then
  echo "❌ Error: Android project not found. Run 'npx cap add android' first"
  exit 1
fi

echo "📄 Copying google-services.json to Android project..."
cp "$GOOGLE_SERVICES_SOURCE" "$GOOGLE_SERVICES_DEST"
echo "✅ google-services.json copied to $GOOGLE_SERVICES_DEST"

