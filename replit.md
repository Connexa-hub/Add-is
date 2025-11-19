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

**November 19, 2025 - REPLIT ENVIRONMENT SETUP COMPLETE**
- **✅ Backend & Admin Dashboard Configured**:
  - Installed all backend dependencies (Express, MongoDB, JWT, etc.)
  - Installed admin dashboard dependencies (React 19, Vite, TailwindCSS) with --legacy-peer-deps
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
  - Development workflow: "Run Application" executes `bash start-all.sh`
  - Backend + Admin run concurrently on ports 3001 and 5000
  - Deployment configured for VM (always-on server for stateful MongoDB connections)
  - Build step: `cd backend && npm install && npm run build:admin`
  - Production run: `cd backend && NODE_ENV=production PORT=5000 node server.js`
  - Production: Single Express server serves both API routes and pre-built admin static files
  
**November 19, 2025 - MOBILE APP: REPLIT LIMITATIONS & LOCAL TESTING GUIDE**
- **⚠️ React Native Mobile App Cannot Run in Replit**:
  - The `frontend/` React Native + Expo app is designed for mobile devices (iOS/Android)
  - Replit's web environment cannot reliably run Expo Metro bundler or mobile simulators
  - Runtime error seen: `ReferenceError: Property 'tokens' doesn't exist` occurs when trying to run Expo web mode
  - This error is due to missing browser polyfills for React Native crypto/buffer modules
  - **Solution**: Run the mobile app locally on your development machine with physical devices or simulators

- **📱 How to Run Mobile App Locally**:
  ```bash
  # On your local machine (macOS, Windows, or Linux):
  cd frontend
  npm install
  npx expo start
  
  # For tunnel mode (test from any device on internet):
  npx expo start --tunnel
  
  # Scan QR code with Expo Go app (iOS/Android)
  # Or press 'a' for Android emulator, 'i' for iOS simulator
  ```

- **🔗 Connect Mobile App to Replit Backend**:
  - Update frontend API base URL to point to your Replit deployment
  - In `frontend/services/api.ts` or similar, use your Replit URL
  - Example: `https://your-repl-name.your-username.repl.co/api`

## Known Issues & Bug Backlog (Mobile App - For Local Development)

The following bugs have been identified in the React Native mobile app and need to be fixed during local development:

### 🔴 CRITICAL Priority

**1. Authentication Navigation Bug**
- **Issue**: After successful login/signup and fingerprint authentication, app remains stuck on login/email verification screen
- **Expected**: Should navigate directly to Home screen after successful fingerprint authentication
- **Affected Flows**:
  - New users: Sign up → Email verification → Fingerprint setup → Should go to Home (currently stuck)
  - Existing users: Login → Fingerprint auth → Should go to Home (currently stuck)
- **Fix Required**: Check navigation logic in biometric authentication success callback; ensure no redundant login state checks blocking navigation

**2. Payment Preview Bottom Sheet Design Issues**
- **Issue**: Payment preview appears as full-screen modal with floating space above navigation bar
- **Expected**: Should be bottom-sheet modal (OPay-style) covering ~50% of screen, anchored to bottom, compact layout
- **Screenshots**: Images 1-4 show the floating modal issue
- **Fix Required**:
  - Convert from full-screen modal to BottomSheetModal component
  - Set modal height to ~50% of screen
  - Remove margins causing floating effect
  - Anchor to bottom edge (no space between modal and nav bar)
  - Redesign layout to be compact - all info visible without scrolling
  - Remove "Cancel" button
  - Change "Pay with Fingerprint" button text to just "Pay"

**3. Fingerprint/PIN Validation Error**
- **Issue**: When "Pay" button clicked → Fingerprint modal shows → After authentication → Shows "validate error"
- **Screenshot**: Image 5 shows authentication screen with error
- **Expected**: Fingerprint should validate against transaction PIN; if no PIN set, redirect to PIN creation first
- **Fix Required**:
  - Fix fingerprint validation logic to link with transaction PIN
  - Handle case when PIN doesn't exist: redirect to PIN creation screen
  - Implement proper error messages (remove generic "validate error")

**4. PIN Input Flow Using System PIN Instead of App PIN**
- **Issue**: When fingerprint modal shows "Use PIN" text at bottom, tapping it opens phone system PIN instead of app's secure keyboard
- **Screenshot**: Image 3 shows the secure keyboard (correct), but currently system PIN is triggered first
- **Expected**: "Use PIN" should show in-app secure keyboard for transaction PIN (OPay-style)
- **Fix Required**:
  - Replace system PIN prompt with custom SecureKeyboard component
  - Ensure "Use PIN" triggers in-app PIN entry modal
  - Validate against user's transaction PIN (not device PIN)

**5. Payment Preview State Reset Issue**
- **Issue**: After cancelling payment preview and returning to product selection:
  - Previously selected product remains selected
  - Selecting NEW product shows "Pay" button in loading state
  - Cannot process payment for newly selected product
- **Expected**: When payment preview cancelled, reset all selection states and allow fresh product selection
- **Fix Required**:
  - Add cleanup function on payment preview dismiss:
    - Clear selected product state
    - Reset payment form
    - Clear loading states
    - Reset transaction data
  - Ensure new product selection creates fresh transaction
  - Remove cached payment data on cancellation

### 🟡 HIGH Priority

**6. PIN Setup Flow Requirements**
- **Expected Behavior**:
  1. First transaction without PIN: Pay button → PIN creation screen → Create PIN → Enable fingerprint option → Process payment
  2. Settings approach: Settings → Enable fingerprint → If no PIN → Trigger PIN creation → Then enable fingerprint
  3. Fingerprint should only work AFTER PIN is created
- **Fix Required**:
  - Add PIN existence check before payment
  - If no PIN: redirect to CreatePINScreen
  - After PIN creation: show "Enable Fingerprint" option
  - Update Settings: Add PIN requirement check before enabling fingerprint

### 🟢 MEDIUM Priority

**7. Product Selection Flow - Remove Bottom Summary**
- **Issue**: In "All Products and Services" screen, there's a small summary card at bottom with button that navigates to payment preview
- **Expected**: After selecting product and filling required fields, automatically navigate to payment preview WITHOUT showing bottom summary card
- **Fix Required**:
  - Remove bottom summary card component entirely
  - Trigger navigation to PaymentPreviewScreen immediately after form completion
  - No intermediate step/confirmation needed

### 🔵 LOW Priority

**8. Network Error Handling**
- **Issue**: When data/internet switched off on home screen, console shows "failed to load user data" but no user-facing error card displays
- **Expected**: Display network error card/banner when connection fails; show "Connection Restored" card when network returns (OPay-style)
- **Fix Required**:
  - Implement network state listener
  - Add NetworkErrorCard component
  - Add ConnectionRestoredCard component
  - Wrap API calls with try-catch showing UI feedback instead of console errors

---

## Testing Checklist (Before Production)

- [ ] Test authentication flow end-to-end (login → fingerprint → home navigation)
- [ ] Test payment preview bottom sheet design on different screen sizes
- [ ] Test PIN creation and fingerprint setup flows
- [ ] Test payment processing with fingerprint and PIN fallback
- [ ] Test network error handling (offline/online transitions)
- [ ] Test product selection and payment preview state management
- [ ] Verify all transactions complete successfully
- [ ] Test on both iOS and Android devices
- [ ] Test with Expo Go and standalone builds

**November 17, 2025 - COMPREHENSIVE PAYMENT FLOW & BACKEND FIXES**
- **✅ Fixed Backend Transaction Model Enum Validation** (PRODUCTION BLOCKER RESOLVED):
  - Extended Transaction model enum to include all service types: 'education', 'insurance', 'internet', 'betting'
  - Fixed all transaction creation in serviceController.js to use correct fields:
    - type: 'debit' (for purchases) or 'credit' (for wallet funding)
    - category: 'airtime', 'data', 'electricity', 'tv', 'education', 'insurance', 'internet', 'betting', 'wallet_funding'
    - status: 'completed', 'failed', 'pending' (not 'success')
    - paymentGateway: 'vtpass', 'monnify', 'manual'
  - Fixed walletController.js to use type='credit' and filter by correct field
  - Resolved 400/500 API errors caused by enum validation failures
- **✅ Eliminated Double Authentication** (CRITICAL UX FIX):
  - Updated PaymentPreviewSheet to pass biometric success flag to payment screens
  - Modified all 6 payment screens (Airtime, Data, TV, Electricity, Internet, Betting) to:
    - Skip PIN verification when biometric authentication succeeds
    - Fall back to PIN when biometric fails or is not available
  - Payment flow now: Biometric OR PIN (not both) for seamless user experience
- **✅ Consistent Payment Flow Across All Screens**:
  - Standardized confirm/process function pattern across all payment screens
  - Added 30-second timeout detection for API calls
  - Implemented robust error handling with network/timeout detection
  - Added form cleanup on successful transactions
  - Fixed processing overlay state management
- **✅ Login Screen Logo Enhanced**:
  - Increased logo size from 60x60 to 100x100 pixels for better visibility
  - Improved spacing and alignment for OPay-style professional appearance

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