# VTU Bill Payment Platform - Connexa

## Overview
Connexa is a comprehensive VTU (Virtual Top-Up) bill payment platform designed to offer a wide range of services including airtime, data, TV subscriptions, and electricity bill payments. The platform aims to provide a seamless and efficient user experience through its React Native mobile application and a robust admin dashboard. The business vision is to capture a significant share of the digital bill payment market by offering a reliable, secure, and user-friendly service with a focus on fintech-grade UX.

## User Preferences
I prefer detailed explanations and for you to ask before making major changes. I want to ensure the mobile app's critical bugs are prioritized for local development. Do not make changes to files or folders that are not directly related to the critical bugs. I prefer an iterative development approach, focusing on one bug fix at a time before moving to the next.

## System Architecture
The platform comprises a Node.js/Express backend, a React Native (Expo) mobile frontend, and a React 19/Vite admin dashboard. MongoDB Atlas is used for the database, with JWT for authentication. Monnify handles payments (cards, virtual accounts), and VTPass is integrated for various VTU services.

### UI/UX Decisions
The mobile app features an OPay-style design with:
- **Instant Dark/Light Mode Switching**: Real-time theme management persisting across sessions, with themes adapting automatically across all screens. Color systems include `lightColors` and `darkColors` for accessibility.
- **Fluent Navigation**: React Navigation with `CardStyleInterpolators.forHorizontalIOS` for smooth transitions, dynamic background colors to prevent flashes.
- **Silent Loading States**: Comprehensive skeleton loader system replaces traditional activity indicators for a professional loading experience, except in authentication flows.
- **Homescreen UX**: Compact dashboard with horizontal account details and an integrated copy button.

### Technical Implementations
- **Multi-step KYC Verification**: Includes BVN/NIN, document uploads, and selfie verification.
- **Authentication**: Transaction PIN and biometric authentication (fingerprint/face ID) with a PCI-compliant card vault.
- **Dynamic Content**: Dynamic banner management.
- **VTU Categories**: Supports 7 categories: Airtime, Data, TV, Electricity, Education, Insurance, Internet.
- **Network Auto-detection**: Automatically detects network providers from phone numbers.
- **Email Verification**: OTP-based email verification.
- **Backend Enhancements**: Transaction model enum validation for various service types and categories, refined transaction creation, and wallet management.
- **Biometric Flow**: Biometric authentication triggers before credential saving, with a fallback to PIN.
- **Payment Flow Consistency**: Standardized confirm/process functions across all payment screens with 30-second API timeouts and robust error handling.

### Feature Specifications
- **VTU Services**: Airtime, Data, TV, Electricity, Education, Insurance, Internet.
- **Payment Options**: Cards and virtual accounts via Monnify.
- **Security**: JWT authentication, transaction PIN, biometric authentication, PCI-compliant card vault.
- **User Management**: KYC, email verification.

## External Dependencies
- **Database**: MongoDB Atlas
- **Payment Gateway**: Monnify
- **VTU API**: VTPass
- **Email Service**: Gmail (for notifications)