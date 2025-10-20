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

## Deployment Configuration

### Replit Environment (Development)
- **Backend API**: Running on port 5000 (`http://0.0.0.0:5000`)
- **Admin Dashboard**: Served from backend (production mode only)
- **Health Check**: `http://0.0.0.0:5000/api/health`
- **Workflow**: `Backend + Admin Panel` (PORT=5000 npm start)
- **Environment**: Development mode

### Koyeb Deployment (Production)
- **Dockerfile**: Multi-stage build configured
- **Port**: 8000 (Koyeb standard)
- **Health Check**: `/api/health`
- **Build**: Automated admin panel build + backend deployment
- **Configuration**: See `koyeb.yaml` and `KOYEB_DEPLOYMENT_COMPLETE.md`

### Frontend Configuration
- **Mobile App API**: Configure to use deployed backend URL
- **Admin Dashboard API**: Served from backend in production mode
- **Development API**: `http://localhost:5000/api` (Replit)

## External Dependencies
- **MongoDB Atlas**: Cloud-hosted database for data storage (✅ Connected).
- **VTPass API**: Integration for VTU services (airtime, data, electricity, TV, etc.), currently in sandbox mode (✅ Configured).
- **Monnify Payment Gateway**: Integration for card payments, wallet funding (virtual accounts), and payment verification, currently in sandbox mode (✅ Configured).
- **Nodemailer**: Used for sending email notifications, specifically for email verification (⚠️ Requires SMTP credentials).
- **Expo**: For React Native mobile app development and testing.
- **Lucide React**: Icon library used in the Admin Dashboard.

## Recent Updates (October 20, 2025)
- ✅ Configured Replit deployment with backend on port 5000
- ✅ Built admin panel for production deployment
- ✅ Created Dockerfile for Koyeb deployment (multi-stage build)
- ✅ Set up koyeb.yaml service configuration
- ✅ Configured health check endpoint
- ✅ Updated workflow to serve backend + admin panel
- ✅ Completed comprehensive app verification report
- ✅ All environment variables (secrets) configured
- ✅ MongoDB Atlas connection verified

## Deployment Status
- **Replit (Development)**: ✅ LIVE - Backend running on port 5000
- **Koyeb (Production)**: ✅ READY TO DEPLOY - All configuration files prepared
- **Admin Panel**: ✅ Built and ready (dist folder created)
- **Database**: ✅ MongoDB Atlas connected
- **API Health**: ✅ All core endpoints operational

## Next Steps for Production
1. Deploy to Koyeb using Dockerfile
2. Update VTPass credentials to production mode
3. Update Monnify credentials to production mode
4. Configure proper email SMTP service
5. Enable MongoDB automated backups
6. Set up monitoring (Sentry, LogRocket, etc.)
7. Load testing and security audit
8. Change default admin password