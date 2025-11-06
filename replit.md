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