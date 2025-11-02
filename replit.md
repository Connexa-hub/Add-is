# VTU Bill Payment Platform - Connexa (Opay-Style Features)

## Overview
Connexa is a Virtual Top-Up (VTU) bill payment platform designed with Opay-style features, including a mobile app and an admin dashboard. Its primary purpose is to facilitate various bill payments such as electricity, data, and TV subscriptions, alongside comprehensive wallet services. The platform incorporates advanced KYC verification, dynamic promotional banners, and secure payment functionalities.

The project aims to provide a robust, user-friendly, and secure platform for digital transactions, adhering to regulatory standards like CBN's BVN/NIN compliance for virtual account creation. Key capabilities include a complete KYC system, dynamic banner management, a comprehensive VTU product catalog with network auto-detection, secure transaction PIN and biometric authentication, a card vault for tokenized payments, and cashback rewards. The platform is built for scalability and a rich user experience, with ambitions to capture a significant share of the digital payments market.

## User Preferences
- No specific coding preferences set yet
- Standard JavaScript/TypeScript conventions
- React best practices
- RESTful API design

## Recent Changes
**November 2, 2025 - Authentication & Biometric Login Fixes**
- Fixed login failure issue: Updated biometric login to use `/api/auth/biometric-login` endpoint with proper token instead of password-based authentication
- Fixed registration "email already exists" issue: Backend now detects unverified accounts and returns `requiresVerification` flag, frontend navigates to verification screen
- Implemented proper biometric authentication flow (OPay-style):
  - Added `/api/auth/enable-biometric` endpoint that generates secure biometric token
  - Updated `useBiometric.ts` hook to request and store biometric token in SecureStore
  - Modified `LoginScreen.tsx` to use biometric token for re-authentication
  - Updated `RegisterScreen.tsx` to handle unverified email responses
- Increased rate limits for development (100 auth requests, 1000 general requests per 15 min) to allow testing multiple accounts
- Splash screen animation already implemented and working
- Backend running on port 3001, configured for Replit environment

## System Architecture

### UI/UX Decisions
The platform features a modern UI with a focus on Opay-style aesthetics.
- **Mobile App**: Gradient colors, glassmorphism backgrounds, neomorphic cards, and service-specific icons. Custom biometric modals are used for security and interaction.
- **Admin Dashboard**: A clean and functional interface for managing platform operations.

### Technical Implementations
- **KYC System**: Multi-step verification including BVN/NIN, document upload, selfie, and admin review. Virtual accounts require KYC approval.
- **Banner Management**: Dynamic promotional banners supporting images, videos, and GIFs, with scheduling, section targeting, randomization, and tracking.
- **VTU Product Catalog**: Comprehensive management of ALL 7 VTPass categories (Airtime, Data, TV, Electricity, Education, Insurance, Other Services) with VTPass API sync, admin CRUD operations, bulk actions, and price/commission control. Includes 30+ service providers and network auto-detection.
- **Transaction PIN & Biometric**: Secure 4-6 digit PIN with bcrypt hashing, lockout protection, and biometric authentication.
- **Card Vault & Payment**: Monnify integration for PCI-compliant card tokenization, saved card management, and PIN-protected card detail reveal.
- **Wallet Funding**: Integration with Monnify for virtual account creation and card payments.
- **Security Enhancements**: Rate limiting, webhook signature verification, JWT authentication, email verification, input validation, and secure error handling.

### System Design Choices
- **Backend**: Node.js/Express.js API server using MongoDB Atlas. JWT for authentication, Nodemailer for email verification.
- **Frontend (Mobile App)**: React Native + Expo, with React Navigation and React Native Paper.
- **Admin Dashboard**: React 19 + Vite, React Router v7, and Axios.
- **Deployment**: Configured for Replit VM mode for stateful services and automatic startup.
- **Email Verification**: Mandatory for new accounts, using OTP via email.

## External Dependencies
- **MongoDB Atlas**: Cloud-hosted database.
- **VTPass API**: Integration for VTU services (airtime, data, electricity, TV, etc.), currently in sandbox mode.
- **Monnify Payment Gateway**: Integration for card payments, virtual accounts, and payment verification, currently in sandbox mode.
- **Nodemailer**: Used for sending email notifications.
- **Expo**: For React Native mobile app development and testing.
- **Lucide React**: Icon library used in the Admin Dashboard.