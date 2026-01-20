# AV1ATE Tracker - Aircraft Maintenance Tracker

## Overview

AV1ATE Tracker is a mobile application for private aircraft owners to track maintenance and inspection schedules. The app monitors calendar-based and flight-hours-based maintenance items, providing status indicators (green/yellow/red) and notifications when items are due or overdue.

The project uses a React Native (Expo) frontend with a Node.js/Express backend. Features a Tesla-inspired dark premium UI with multi-aircraft support.

## Recent Changes (January 2026)

- **Rebranded to AV1ATE Tracker**: All user-visible references updated from AIRFAX to AV1ATE Tracker
- **Enhanced Notifications**: Local notifications scheduled for due soon and overdue items with deep linking
- **Improved IAP UX**: Friendly messages in Expo Go explaining purchases work in TestFlight/App Store builds
- **Feedback Form**: Primary action now opens Google Form directly in browser
- **Multi-Aircraft Support**: Users can now manage multiple aircraft with independent maintenance items and hours
- **Aircraft Selector**: Tesla-style bottom sheet selector accessible by tapping the tail number on Home screen
- **Data Migration**: Legacy single-aircraft data automatically migrates to new multi-aircraft format
- **Per-Aircraft Data**: Each aircraft has its own Hobbs/Tach hours, maintenance items, and thresholds
- **In-App Purchase**: $9.99 lifetime unlock via RevenueCat (requires EAS development build)
- **14-Day Free Trial**: New users get 14-day trial with full access
- **Access Control**: Edit operations blocked when trial expires (redirects to Paywall)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo (React Native) with TypeScript
- **Navigation**: React Navigation with native stack navigator (not Expo Router file-based routing despite initial specs)
- **State Management**: TanStack React Query for server state
- **Styling**: StyleSheet with custom theme constants, dark mode only
- **Animations**: React Native Reanimated for smooth interactions
- **Component Structure**: Functional components with custom hooks (`useTheme`, `useScreenOptions`)

**Key Design Decisions**:
- Path aliases configured (`@/` for client, `@shared/` for shared code) via Babel module-resolver
- Custom theming system in `client/constants/theme.ts` with Colors, Spacing, Typography, and BorderRadius
- Error boundary implementation for crash recovery
- Keyboard-aware scroll view compatibility layer for cross-platform input handling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build Tool**: tsx for development, esbuild for production bundling
- **API Pattern**: RESTful routes prefixed with `/api`
- **Storage**: In-memory storage class (`MemStorage`) implementing `IStorage` interface - designed for easy swap to database

**Key Design Decisions**:
- CORS configured for Replit domains and localhost development
- Separation of routes registration from server setup
- Storage abstraction layer ready for database integration

### Data Layer
- **Local Storage**: AsyncStorage for offline-first data persistence
- **Multi-Aircraft Storage**: Uses AsyncStorage keys for all aircraft data
- **Migration**: Automatic migration from legacy single-aircraft format to multi-aircraft
- **Schema Location**: `client/types/data.ts` for TypeScript types

**Data Structure**:
- `MultiAircraftData`: Contains `aircraftList` array and `activeAircraftId`
- Each `Aircraft` has: id, tail, model, hourMode, current hours, thresholds, maintenanceItems[], documents[]
- `DataContext` provides active aircraft data to all screens via `useData()` hook

**Key Files**:
- `client/lib/storage.ts`: Multi-aircraft storage operations with migration logic
- `client/context/DataContext.tsx`: React context for aircraft state management
- `client/components/AircraftSelectorSheet.tsx`: Bottom sheet UI for aircraft selection
- `client/screens/AddAircraftScreen.tsx`: Form for adding new aircraft

### Notifications System
- **Library**: expo-notifications for local push notifications
- **Triggers**: Notifications sent when maintenance items become "due soon" or "overdue"
- **Deep Linking**: Tapping notification navigates to the specific maintenance item
- **Management**: Notifications are rescheduled when hours are updated or maintenance is logged

**Key Files**:
- `client/lib/notifications.ts`: Core notification scheduling and management
- `client/services/notifications.ts`: High-level notification service with initialization
- `client/context/DataContext.tsx`: Triggers notification updates on data changes

### Entitlement & Purchases Layer
- **Trial System**: 14-day free trial stored in SecureStore (AsyncStorage fallback for web)
- **RevenueCat IAP**: $9.99 lifetime purchase, graceful degradation in Expo Go
- **Access Control**: `EntitlementContext` provides `canEdit` flag to block edit actions

**Key Files**:
- `client/lib/entitlement.ts`: Trial logic, isPro status, SecureStore persistence
- `client/lib/purchases.ts`: RevenueCat integration with dynamic module loading
- `client/lib/purchases.config.ts`: RevenueCat API key configuration
- `client/context/EntitlementContext.tsx`: React context for entitlement state
- `client/screens/PaywallScreen.tsx`: Purchase/restore UI with Tesla styling

## In-App Purchases (IAP) Testing Notes

**IMPORTANT**: IAP does NOT work in Expo Go.

- In Expo Go, users see a friendly message: "Purchases work in the App Store/TestFlight build"
- IAP only works in TestFlight/App Store builds (requires EAS development build)
- Use Apple Sandbox test users for testing purchases
- Product ID: `av1ate_lifetime_999` (non-consumable lifetime unlock)
- RevenueCat entitlement ID: `pro`

**Environment Variables**:
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`: RevenueCat iOS API key
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`: RevenueCat Android API key

## External Dependencies

### Database
- PostgreSQL (configured via `DATABASE_URL` environment variable)
- Drizzle ORM for queries and schema management

### Mobile/Expo Libraries
- expo-haptics: Tactile feedback
- expo-notifications: Local push notifications
- expo-splash-screen: Launch screen
- expo-status-bar: Status bar styling
- expo-web-browser: External link handling
- expo-glass-effect: iOS glass blur effects
- react-native-gesture-handler: Touch gestures
- react-native-reanimated: Animations
- react-native-keyboard-controller: Keyboard management
- react-native-safe-area-context: Safe area handling

### Development Infrastructure
- Replit deployment environment (uses `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS` environment variables)
- Metro bundler proxy configuration for Replit
- Custom build script for static web exports

### Icons and Assets
- @expo/vector-icons (Feather icon set used)
- Custom app icon at `assets/images/icon.png`

## Feedback
- Feedback form URL: https://forms.gle/tLWcxPXtR16PU1Zg7
- Users can optionally write a message locally and copy it before opening the form
