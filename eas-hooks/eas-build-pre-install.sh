#!/bin/bash

# EAS Build Pre-install Hook
echo "Running pre-install hook..."

# Set environment variables to help with Material Design issues
export ANDROID_ENABLE_RESOURCE_OPTIMIZATIONS=false
export ANDROID_NON_TRANSITIVE_R_CLASS=false
export ANDROID_NON_FINAL_RES_IDS=false

echo "Environment variables set for Android build compatibility"
