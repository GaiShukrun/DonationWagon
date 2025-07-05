<div align="center">
<h1>DONATION WAGON</h1>

Empowering Giving, Transforming Communities Together
</div>

<div align="center">

[![last commit](https://img.shields.io/badge/last_commit-last_sunday-blue)]()
[![typescript](https://img.shields.io/badge/typescript-65.5%25-blue)]()
[![languages](https://img.shields.io/badge/languages-3-blue)]()

</div>


## Built with the tools and technologies:

<div align="center">

[![Express](https://img.shields.io/badge/-Express-black?style=flat-square&logo=express)]()
[![JSON](https://img.shields.io/badge/-JSON-black?style=flat-square&logo=json)]()
[![Markdown](https://img.shields.io/badge/-Markdown-black?style=flat-square&logo=markdown)]()
[![Expo](https://img.shields.io/badge/-Expo-black?style=flat-square&logo=expo)]()

[![npm](https://img.shields.io/badge/-npm-red?style=flat-square&logo=npm)]()
[![Mongoose](https://img.shields.io/badge/-Mongoose-red?style=flat-square&logo=mongoose)]()
[![.ENV](https://img.shields.io/badge/-.ENV-yellow?style=flat-square&logo=dotenv)]()
[![JavaScript](https://img.shields.io/badge/-JavaScript-yellow?style=flat-square&logo=javascript)]()
[![sharp](https://img.shields.io/badge/-sharp-green?style=flat-square&logo=sharp)]()

[![Nodemon](https://img.shields.io/badge/-Nodemon-green?style=flat-square&logo=nodemon)]()
[![React](https://img.shields.io/badge/-React-blue?style=flat-square&logo=react)]()
[![TypeScript](https://img.shields.io/badge/-TypeScript-blue?style=flat-square&logo=typescript)]()
[![bat](https://img.shields.io/badge/-bat-blue?style=flat-square&logo=bat)]()

[![Axios](https://img.shields.io/badge/-Axios-purple?style=flat-square&logo=axios)]()
[![styled-components](https://img.shields.io/badge/-styledcomponents-pink?style=flat-square&logo=styled-components)]()
[![Jest](https://img.shields.io/badge/-Jest-red?style=flat-square&logo=jest)]()


</div>


## Overview

Donation Wagon connects donors with those in need through an intuitive mobile platform. The app allows users to donate clothing and toys, schedule pickups, and track their donation history. The app features AI-powered item recognition to streamline the donation process and a gamified experience with leaderboards to encourage community participation.

## Core Features

###  Donation Management
- **🤖AI-Powered Item Recognition**: Leverages advanced AI for rapid and accurate identification of item details, making the donation process smoother and faster by automatically detecting clothing types, colors, sizes, and genders from uploaded images
- **Multi-Item Donations**: Support for adding multiple clothing or toy items in a single donation
- **Rich Media Support**: Upload and manage multiple images per donation item
- **Smooth UX**: Animated scrolling and intuitive form navigation

### 📅 Scheduling System
- **Flexible Pickup Scheduling**: Choose date and time for donation pickup
- **Location Options**: Use GPS or manual address entry
- **Delivery Instructions**: Add special notes for drivers
- **Status Tracking**: Monitor the status of scheduled pickups

### 👤 User Profiles
- **Donation History**: View past and pending donations
- **Achievement System**: Earn badges and track contribution metrics
- **Community Impact**: Visualize personal impact on community needs

### 🚚 Driver Interface
- **Active Pickups Management**: Dedicated interface for drivers to manage assigned pickups
- **Route Optimization**: Efficient routing for multiple pickups
- **Status Updates**: Real-time status updates for donors and administrators

### 🏆 Community Engagement
- **Leaderboards**: Competitive element to encourage regular donations
- **Impact Metrics**: Visual representation of community impact
- **Exploration**: Discover donation opportunities and community needs

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
- **UI Components**: Custom-styled with a warm color palette (e.g., earth tones and soft hues) to create an inviting atmosphere that aligns with themes of donation and giving
- **Navigation**: Expo Router for type-safe navigation
- **State Management**: React Context API and custom hooks
- **AI Integration**: Google GenAI API for image recognition
- **Media Handling**: Expo Image Picker for camera and gallery access
- **Backend**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT tokens with bcrypt password hashing
- **Location Services**: Expo Location for GPS functionality

## Key Components

### Donation Flow
- **DonationDetails**: Main component for creating and editing donations with AI detection
- **DonationCart**: Manages the collection of items being donated
- **AI Identify**: Button that triggers AI analysis of uploaded images

### Scheduling Flow
- **ScheduleScreen**: Interface for scheduling pickup times and locations
- **LocationPicker**: Component for selecting between GPS and manual address entry
- **DateTimePicker**: Custom calendar and time selection interface

### Driver Interface
- **ActivePickups**: Shows drivers their assigned pickups for the day
- **DriverDashboard**: Central hub for driver activities and metrics

## Accessibility Features

- Screen reader support for critical UI elements
- Scalable text sizes for better readability
- High contrast color options
- Keyboard navigation support

## Troubleshooting

If you encounter connection issues:

1. Make sure both the backend and frontend servers are running
2. Verify that the API URL in `hooks/useApi.js` matches your local network IP
3. Check that CORS is properly configured in the backend
4. Restart both servers using the `start-app.bat` script

## Contributing

Please read our contributing guidelines before submitting pull requests to the project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
