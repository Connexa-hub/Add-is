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
**November 3, 2025 - Chat-Based Support System Implementation**
- **Complete Support Chat System**: Implemented full-featured chat-based support for user-admin communication
  - Backend: Added `POST /api/admin/support/:id/reply` endpoint for both users and admins to add chat messages
  - Modified existing reply endpoints to use replies array format for continuous conversations
  - All replies stored with userId, message, isAdmin flag, and timestamps
  - Proper authentication: users can only reply to their own tickets, admins can reply to any ticket
- **Mobile App Chat Interface**: Enhanced frontend/screens/SupportScreen.tsx with modern chat UI
  - Chat-style interface showing full conversation history in chronological order
  - Visual distinction between user messages (white) and admin replies (blue)
  - Message timestamps for all communications
  - Input field and send button for real-time replies
  - Auto-scroll to latest messages
  - Pull-to-refresh for updating conversation
- **Admin Web Panel Chat View**: Updated backend/admin-web/src/pages/Support.jsx
  - Full-height modal displaying complete chat conversation thread
  - Shows sender name (user name or "Support Team") for each message
  - Chronological message display with timestamps
  - Reply input at bottom with send functionality
  - Status management buttons (Mark Pending, Mark Resolved)
  - Real-time updates when sending messages
- **API Service Updates**: Added support for chat replies in admin-web/src/services/api.js
  - New `addReply` function for sending chat messages to support tickets
  - Maintains backward compatibility with existing support endpoints

**November 2, 2025 - CRITICAL: Complete Authentication & Email Service Overhaul**
- **Email Service Hardening**: Completely rewrote email service to fail-fast with clear error messages instead of silent failures
  - Added startup validation that checks for EMAIL_USER and EMAIL_PASS configuration
  - Email sending now throws proper errors instead of returning success:false
  - Clear error messages distinguish between configuration issues vs. send failures
- **Authentication Route Improvements**: Updated all auth endpoints to properly handle and report email failures
  - Registration: Deletes user account if verification email fails to send, provides clear error messages
  - Login: Reports email sending status, distinguishes between config and send errors
  - Resend Verification: Proper error handling with support contact information
  - All routes now provide actionable error messages to users
- **Database Cleanup System**: Created comprehensive cleanup tools for stuck unverified accounts
  - New script: `backend/scripts/cleanupUnverifiedUsers.js` - Removes accounts older than 24 hours
  - Admin endpoint: `POST /api/admin/security/cleanup-unverified` - On-demand cleanup
  - Clears expired verification codes automatically
- **Manual Verification Fallback**: Added admin endpoints for when email service fails
  - `POST /api/admin/security/manual-verify-email` - Manually verify user emails
  - `GET /api/admin/security/unverified-users` - List all unverified accounts with pagination
  - All manual verifications logged for security audit trail
- **Replit Environment Setup**: Configured for optimal Replit deployment
  - Admin-web Vite dev server on port 5000 with `allowedHosts: true`
  - Backend API on port 3001 with proper CORS and proxy configuration
  - Workflow configured to run both servers concurrently
  - Dependencies installed with legacy peer deps for React 19 compatibility
- **Previous Fixes** (from earlier session):
  - Fixed biometric login to use proper token authentication
  - Fixed "email already exists" handling for unverified accounts
  - Increased development rate limits for testing

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