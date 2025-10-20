# VTU Bill Payment Platform - Connexa (Opay-Style Features)

## Overview
Connexa is a Virtual Top-Up (VTU) bill payment platform designed with Opay-style features, including a mobile app and an admin dashboard. Its primary purpose is to facilitate various bill payments such as electricity, data, and TV subscriptions, alongside comprehensive wallet services. The platform incorporates advanced KYC verification, dynamic promotional banners, and secure payment functionalities.

The project aims to provide a robust, user-friendly, and secure platform for digital transactions, adhering to regulatory standards like CBN's BVN/NIN compliance for virtual account creation. Key capabilities include a complete KYC system, dynamic banner management, a comprehensive VTU product catalog with network auto-detection, secure transaction PIN and biometric authentication, a card vault for tokenized payments, and cashback rewards. The platform is built for scalability and a rich user experience, with ambitions to capture a significant share of the digital payments market.

## User Preferences
- No specific coding preferences set yet
- Standard JavaScript/TypeScript conventions
- React best practices
- RESTful API design

## System Architecture

### UI/UX Decisions
The platform features a modern UI with a focus on Opay-style aesthetics. This includes:
- **Mobile App**: Gradient colors (primary: #6366f1, secondary: #14b8a6), glassmorphism backgrounds, neomorphic cards, and service-specific icons for an intuitive user experience. Custom biometric modals enhance security and user interaction.
- **Admin Dashboard**: A clean and functional interface for managing all platform operations.

### Technical Implementations
- **KYC System**: Multi-step verification with BVN/NIN collection, document upload, selfie verification, and an admin review panel. Virtual accounts are created only after KYC approval.
- **Banner Management**: Dynamic promotional banners supporting images, videos, and GIFs, with scheduling, section targeting, weight-based randomization, and tracking.
- **VTU Product Catalog**: ✅ **FULLY IMPLEMENTED** - Comprehensive management of ALL 7 VTPass categories (Airtime, Data, TV, Electricity, Education, Insurance, Other Services). Features include:
  - **VTPass Sync Service**: Automatic sync with VTPass API for all service variations
  - **Admin Product Management**: Full CRUD operations, bulk actions, price/commission control
  - **30+ Service Providers**: MTN, Airtel, Glo, 9mobile, DSTV, GOtv, Startimes, WAEC, JAMB, betting, internet ISPs, and more
  - **Smart Categorization**: Proper category mapping for all services
  - **Purchase Controllers**: Complete backend implementation for all 7 categories
  - **Network Auto-detection**: Automatic network identification from phone numbers
- **Transaction PIN & Biometric**: Secure 4-6 digit PIN setup with bcrypt hashing, lockout protection, biometric authentication toggle, and PIN change functionality.
- **Card Vault & Payment**: Monnify integration for PCI-compliant card tokenization, saved card management, default card selection, and PIN-protected card detail reveal.
- **Wallet Funding**: Integration with Monnify for virtual account creation (instant credit) and card payments.
- **Security Enhancements**: Rate limiting, webhook signature verification, JWT authentication, email verification, input validation, and secure error handling.

### System Design Choices
- **Backend**: Node.js/Express.js API server, using MongoDB (Atlas) for the database. Authentication is handled via JWT tokens, and email verification uses Nodemailer.
- **Frontend (Mobile App)**: React Native + Expo, utilizing React Navigation for routing and React Native Paper for UI components.
- **Admin Dashboard**: Built with React 19 + Vite, React Router v7 for routing, and Axios for HTTP requests.
- **Deployment**: Configured for Replit VM mode, ensuring stateful services and automatic startup of both backend and admin dashboard.
- **Email Verification**: Mandatory for new accounts, involving OTP delivery via email for account activation.

## Admin Dashboard Access
- **URL**: Running on port 5000 (accessible via webview)
- **Default Credentials**:
  - Email: `admin@example.com`
  - Password: `Admin123!`
- **Note**: Change password after first login for security

## Frontend Configuration
- **Mobile App API**: Configured to use Replit domain (`https://b59379ed-6096-4be9-99d1-6c853dabcb5e-00-1d9abf325xpqy.worf.replit.dev:3001`)
- **Admin Dashboard API**: Uses Vite proxy to forward `/api` requests to backend on port 3001
- **Backend API**: Running on port 3001

## External Dependencies
- **MongoDB Atlas**: Cloud-hosted database for data storage.
- **VTPass API**: Integration for VTU services (airtime, data, electricity, TV, etc.), currently in sandbox mode.
- **Monnify Payment Gateway**: Integration for card payments, wallet funding (virtual accounts), and payment verification, currently in sandbox mode.
- **Nodemailer**: Used for sending email notifications, specifically for email verification.
- **Expo**: For React Native mobile app development and testing.
- **Lucide React**: Icon library used in the Admin Dashboard.