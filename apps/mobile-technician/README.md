# Mobile Technician App

## Overview

React Native mobile application for technicians to view assigned jobs, update job status, upload completion photos, and manage their profile.

## Technology Stack

- **Framework**: React Native
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: Redux Toolkit or Zustand
- **HTTP Client**: Axios
- **Storage**: AsyncStorage / SecureStore
- **Camera**: react-native-image-picker or expo-camera

## Features

- Technician authentication
- Job list (assigned jobs)
- Job details view
- Update job status
- Upload completion photos
- Add completion notes
- Profile management
- Offline support (optional)

## Project Structure

```
apps/mobile-technician/
├── src/
│   ├── App.tsx                 # Root component
│   ├── navigation/             # Navigation setup
│   ├── screens/
│   │   ├── Auth/               # Login
│   │   ├── Jobs/               # Job list
│   │   ├── JobDetails/         # Job details and updates
│   │   ├── Camera/             # Photo capture
│   │   └── Profile/            # Profile
│   ├── components/             # Reusable components
│   ├── services/
│   │   ├── api/                # API client
│   │   ├── auth/               # Auth service
│   │   └── storage/            # Local storage
│   ├── hooks/                  # Custom hooks
│   ├── store/                  # State management
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utility functions
├── android/                    # Android native code
└── ios/                        # iOS native code
```

## API Integration

- auth-service: Authentication
- assignment-service: Job assignments
- ticket-service: Ticket details and updates
- media-service: Photo uploads

## Environment Variables

- `API_URL`: API Gateway URL
- `APP_ENV`: Environment

## Development

```bash
npm install
npm run android  # For Android
npm run ios      # For iOS
```

## Key Features

### Job Management
- View assigned jobs with priority and SLA
- Accept/reject assignments
- Update job status (in_progress, completed)
- Add completion notes
- Upload multiple photos

### Photo Upload
- Camera integration for photo capture
- Photo compression before upload
- Multiple photo support
- Upload progress indication

## Platform-Specific Notes

### Android
- Camera permissions required
- Storage permissions for photo saving

### iOS
- Camera and photo library permissions
- Info.plist configuration required
