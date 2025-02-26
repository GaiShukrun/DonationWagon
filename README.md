# Circle of Giving App

A mobile application for managing donations and scheduling pickup/delivery of donated items.

## Quick Start

The easiest way to start the app is to use the included batch file:

```bash
start-app.bat
```

This will start both the backend server and the Expo development server in separate windows.

## Manual Setup

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the backend server with hot reloading:

   ```bash
   npm run dev
   ```

### Frontend Setup

1. From the project root, install dependencies:

   ```bash
   npm install
   ```

2. Start the Expo development server:

   ```bash
   npx expo start --clear
   ```

## Development Features

### Hot Reloading

- **Backend**: Uses nodemon to automatically restart when files change
- **Frontend**: Uses Expo's fast refresh to update the app without restarting

### Error Handling

- The app is configured to suppress development error overlays
- Custom error handling is implemented through the ErrorBoundary component
- API requests are handled through a custom useApi hook for consistent error management

## Authentication Flow

1. Any user can access the landing page without authentication
2. When a non-signed-in user tries to navigate to other sections (Donate, Schedule, Profile) or interact with buttons on the landing page, they are redirected to sign in first
3. The authentication state is persisted using AsyncStorage
4. The AuthContext provides authentication-related functionality throughout the app

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT tokens with bcrypt password hashing

## Troubleshooting

If you encounter connection issues:

1. Make sure both the backend and frontend servers are running
2. Verify that the API URL in `hooks/useApi.js` matches your local network IP
3. Check that CORS is properly configured in the backend
4. Restart both servers using the `start-app.bat` script
