@echo off
echo Starting Circle of Giving App...

:: Start the backend with nodemon in a new window
start cmd /k "cd backend && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3

:: Start the frontend with Expo in a new window
start cmd /k "npx expo start --clear"

echo Both servers are starting. Check the terminal windows for details.
