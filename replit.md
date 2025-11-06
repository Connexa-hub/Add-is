# VTU Bill Payment Platform - Connexa

## Overview
Connexa is a Virtual Top-Up (VTU) bill payment platform featuring Opay-style functionalities, including a mobile application and an administrative dashboard. Its primary goal is to facilitate various bill payments such as electricity, data, and TV subscriptions, alongside comprehensive wallet services. The platform incorporates advanced KYC verification, dynamic promotional banners, and secure payment functionalities. Connexa aims to be a robust, user-friendly, and secure platform for digital transactions, adhering to regulatory standards like CBN's BVN/NIN compliance for virtual account creation. The project's ambition is to capture a significant share of the digital payments market by offering a scalable and rich user experience.

## User Preferences
- No specific coding preferences set yet
- Standard JavaScript/TypeScript conventions
- React best practices
- RESTful API design

## System Architecture

### UI/UX Decisions
The platform adopts a modern UI with an Opay-style aesthetic. The mobile app features gradient colors, glassmorphism backgrounds, neomorphic cards, service-specific icons, and custom biometric modals for security. The admin dashboard provides a clean and functional interface for platform management.

### Technical Implementations
- **KYC System**: A multi-step verification process including BVN/NIN, document uploads, selfies, and admin review, mandatory for virtual account creation.
- **Banner Management**: Supports dynamic promotional banners with images, videos, and GIFs, featuring scheduling, section targeting, randomization, and tracking.
- **VTU Product Catalog**: Comprehensive management of all 7 VTPass categories (Airtime, Data, TV, Electricity, Education, Insurance, Other Services) with VTPass API synchronization, admin CRUD operations, bulk actions, and price/commission control. Includes over 30 service providers and network auto-detection.
- **Transaction Security**: Implements a secure 4-6 digit PIN with bcrypt hashing, lockout protection, and biometric authentication (fingerprint/face ID).
- **Card Vault & Payment**: Monnify integration for PCI-compliant card tokenization, saved card management, and PIN-protected card detail reveal.
- **Wallet Funding**: Integrates with Monnify for virtual account creation and card payments.
- **Security Enhancements**: Includes rate limiting, webhook signature verification, JWT authentication, email verification, robust input validation, and secure error handling.

### System Design Choices
- **Backend**: Built with Node.js/Express.js, using MongoDB Atlas for the database, JWT for authentication, and Nodemailer for email services.
- **Frontend (Mobile App)**: Developed using React Native + Expo, with React Navigation and React Native Paper.
- **Admin Dashboard**: Developed with React 19 + Vite, utilizing React Router v7 and Axios for API communication.
- **Deployment**: Configured for Replit VM mode, ensuring stateful services and automatic startup.
- **Email Verification**: Mandatory for all new accounts, implemented via OTP sent to email.

## External Dependencies
- **MongoDB Atlas**: Cloud-hosted NoSQL database.
- **VTPass API**: Integrated for various VTU services (airtime, data, electricity, TV, etc.), currently in sandbox mode.
- **Monnify Payment Gateway**: Utilized for card payments, virtual account creation, and payment verification, currently in sandbox mode.
- **Nodemailer**: Used for sending email notifications and verification emails.
- **Expo**: Essential for React Native mobile application development and testing.
- **Lucide React**: Icon library used within the Admin Dashboard.

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