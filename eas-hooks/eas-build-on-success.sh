#!/bin/bash

# EAS Build Success Hook
echo "Build completed successfully!"

# Clean up any temporary files
if [ -d "android/build" ]; then
    echo "Cleaning up build directory..."
    rm -rf android/build/intermediates/incremental
fi
