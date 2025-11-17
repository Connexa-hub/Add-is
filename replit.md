# VTU Bill Payment Platform - Connexa

## Overview
Connexa is a full-featured VTU bill payment platform with React Native mobile app and admin dashboard. Supports airtime, data, TV, electricity, and more via VTPass integration.

## Tech Stack
- **Backend**: Node.js/Express, MongoDB Atlas, JWT auth
- **Frontend**: React Native + Expo
- **Admin**: React 19 + Vite
- **Payments**: Monnify (cards, virtual accounts)
- **VTU**: VTPass API integration

## Architecture
- Multi-step KYC verification (BVN/NIN, documents, selfie)
- Transaction PIN + biometric authentication
- PCI-compliant card vault
- Dynamic banner management
- 7 VTU categories: Airtime, Data, TV, Electricity, Education, Insurance, Internet
- Network auto-detection from phone numbers
- Email verification (OTP-based)

## Recent Changes

**November 6, 2025 - MAJOR UX UPGRADE: Instant Dark Mode & Fluent Navigation (OPay-Style)**
- **✅ Instant Dark/Light Mode Switching** (NO App Restart Required):
  - Created comprehensive ThemeContext system (`frontend/contexts/ThemeContext.tsx`) for real-time theme management
  - Theme persists across app restarts via AsyncStorage
  - Toggle in Settings → Appearance instantly switches entire app theme
  - Updated color system (`frontend/src/theme/colors.ts`) with both `lightColors` and `darkColors`
  - Dark mode: Dark backgrounds (#121212, #1E1E1E) with light text (#FFFFFF)
  - Light mode: White backgrounds (#FFFFFF) with dark text (#1a1a1a)
  - All screens automatically adapt to theme changes in real-time
  - Wrapped App.tsx with ThemeProvider for global theme management
- **✅ Fluent Navigation Without Flashes** (OPay-Style Smooth Transitions):
  - Configured React Navigation with `CardStyleInterpolators.forHorizontalIOS` for smooth iOS-style transitions
  - Set dynamic `cardStyle: { backgroundColor }` based on current theme to prevent white/black flashes
  - Navigation background color matches current theme (light/dark)
  - No more jarring white/black flashes between screen transitions
  - Professional fintech-grade navigation experience
- **✅ Silent Loading States with Skeleton Loaders** (OPay-Style):
  - Created comprehensive skeleton loader system (`frontend/src/components/atoms/SkeletonLoader.tsx`)
  - Components: SkeletonLoader, SkeletonCard, SkeletonList, SkeletonBalanceCard, SkeletonServiceGrid
  - Skeleton loaders use smooth fade animations (opacity interpolation)
  - Replaced spinning ActivityIndicators with skeleton loaders in:
    - HomeScreen: SkeletonBalanceCard and SkeletonServiceGrid
    - DataScreen: SkeletonLoader and SkeletonList for networks/plans
    - AirtimeScreen: SkeletonLoader for quick amounts grid
  - KEPT ActivityIndicator ONLY in Auth screens (Login, Register, ForgotPassword, ResetPassword, EmailVerification)
  - Loading is now silent and professional like OPay, Kuda, PalmPay
- **✅ Production-Ready UX Improvements**:
  - No blank frame during theme loading (smooth transition)
  - Theme preference loads before app renders
  - All color tokens properly contrasted for accessibility
  - Fintech-grade fluent experience matching industry leaders

**November 17, 2025 - REPLIT ENVIRONMENT SETUP**
- **✅ Backend & Admin Dashboard Configured**:
  - Installed all backend dependencies (Express, MongoDB, JWT, etc.)
  - Installed admin dashboard dependencies (React 19, Vite, TailwindCSS)
  - Backend API running on port 3001 (localhost)
  - Admin Dashboard running on port 5000 (0.0.0.0 for Replit proxy)
  - Vite configured with `allowedHosts: true` for Replit environment
  - Vite proxy configured to forward /api and /uploads to backend on port 3001
- **✅ Environment Variables Configured**:
  - MONGO_URI: MongoDB Atlas connection
  - JWT_SECRET: Secure token encryption
  - VTPASS_API_KEY & VTPASS_SECRET_KEY: Bill payment API
  - MONNIFY_API_KEY, MONNIFY_SECRET_KEY, MONNIFY_CONTRACT_CODE: Payment gateway
  - EMAIL_USER & EMAIL_PASS: Gmail for notifications
- **✅ Workflow & Deployment**:
  - Development workflow: `bash start-all.sh` (runs backend + admin)
  - Deployment configured for VM (always-on server)
  - Build step: Builds admin dashboard into backend/admin-web/dist
  - Production: Single server on port 5000 serves both API and admin UI

**November 6, 2025 - CRITICAL PRODUCTION FIXES: Biometric Authentication & Homescreen UI**
- **✅ Fixed Biometric Authentication System Prompt** (PRODUCTION BLOCKER RESOLVED):
  - Updated `useBiometric.ts` `enableBiometric()` function to trigger system biometric authentication BEFORE saving credentials
  - Flow now follows OPay pattern: User enables → System prompts for fingerprint → Authentication succeeds → Credentials saved
  - Added proper error handling for cancelled/failed authentication
  - Fixed in both InitialSetupScreen and SettingsScreen
  - Users can no longer enable biometric without actually authenticating with their fingerprint/face ID
  - Shows clear success/error alerts with appropriate feedback
- **✅ Improved Homescreen UX - Compact Dashboard** (UI/UX Enhancement):
  - Removed redundant standalone "Virtual Account" card that was cluttering the homescreen
  - Redesigned dashboard card with horizontal account details layout (Bank • Account Number • Name)
  - Added compact copy button directly in dashboard card
  - Reduced homescreen length and improved visual hierarchy
  - Account details still fully accessible in Profile and Wallet sections
  - Follows mobile banking app best practices (similar to OPay, Kuda, PalmPay)