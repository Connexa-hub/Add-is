# VTU Bill Payment Platform

A comprehensive Virtual Top-Up (VTU) bill payment platform with mobile app and admin dashboard for managing electricity, data, TV subscriptions, and wallet services.

## Project Overview

This platform enables users to:
- Pay electricity bills
- Purchase mobile data
- Subscribe to TV services (DSTV, GOTV, etc.)
- Manage wallet balance
- Receive cashback rewards
- Get notifications and promotions

## Quick Start (Replit)

### Running the Application
The project is already configured and running in Replit:
- **Admin Dashboard**: Available at the main Replit URL (port 5000)
- **Backend API**: Running on localhost:3001
- **Frontend (Mobile App)**: React Native/Expo app (for development with Expo Go)

### Environment Setup
All environment variables are configured in `backend/.env`:
- MongoDB Atlas database connected
- VTPass integration in sandbox mode
- JWT authentication enabled

## Project Structure

```
├── backend/              # Node.js/Express API server (Port 3001)
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, validation, logging
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   └── utils/           # VTPass integration
├── frontend/            # React Native mobile app (Expo)
│   ├── src/            # Source code
│   │   ├── components/ # Reusable UI components
│   │   ├── theme/     # Design system (colors, typography, spacing)
│   │   └── hooks/     # Custom React hooks
│   └── screens/       # App screens (Login, Home, etc.)
├── backend/admin-web/  # Admin dashboard (React + Vite, Port 5000)
└── docs/              # Documentation guides
```

## Recent Updates (October 18, 2025)

### ✅ Replit Setup Completed
1. **Backend Configuration**
   - Created `.env` file with MongoDB connection, JWT secret, and VTPass credentials
   - Installed all backend dependencies
   - Environment validation added to prevent startup without required variables

2. **Admin Dashboard Setup**
   - Installed admin-web dependencies
   - Configured Vite dev server on port 5000
   - Enabled proxy to backend API on port 3001
   - Host configuration set for Replit environment (0.0.0.0, allowedHosts: true)

3. **Frontend (Mobile App) Setup**
   - Installed all frontend dependencies
   - Fixed runtime error: "Cannot read property 'colors' of undefined"
   - Updated `useAppTheme` hook to properly return theme with tokens

4. **Workflow Configuration**
   - Single workflow runs both backend and admin-web
   - Backend starts on localhost:3001
   - Admin dashboard serves on 0.0.0.0:5000
   - Both services start automatically

### 📚 New Documentation
Three comprehensive guides have been created:

1. **KOYEB_DEPLOYMENT_GUIDE.md**
   - Complete Koyeb deployment instructions
   - Environment variable configuration
   - Troubleshooting common deployment issues
   - MongoDB Atlas setup
   - Testing and monitoring guidelines

2. **WALLET_FUNDING_GUIDE.md**
   - Detailed explanation of wallet system
   - How users fund their wallets
   - Virtual account number system
   - Payment gateway integration (Paystack/Monnify)
   - Money flow and profit calculation
   - Production setup timeline

3. **MONEY_SYSTEM_DOCUMENTATION.md** (existing)
   - Technical implementation details
   - VTPass integration
   - Cashback system
   - Security measures

## Recent Changes

**October 18, 2025 - Deployment Fixes**
- ✅ Fixed Koyeb deployment issues (unhealthy status)
- ✅ Added environment variable validation (validateEnv.js)
- ✅ Improved server startup with proper error handling
- ✅ Made admin-web build optional for backend-only deployments
- ✅ Added PORT fallback and better MongoDB connection handling
- ✅ Enhanced logging with clear error messages and debugging steps
- ✅ Backend now running successfully in Replit (port 3001)

**October 18, 2025 - Initial Setup**
- ✅ Created admin web dashboard with React + Vite
- ✅ Implemented user management (view, edit, activate/deactivate)
- ✅ Built wallet management system (credit/debit)
- ✅ Added transaction monitoring and filtering
- ✅ Created messaging/announcement system
- ✅ Built support ticket interface
- ✅ Added cashback configuration UI
- ✅ Implemented VTPass wallet monitoring
- ✅ Created system settings page
- ✅ Set up workflows for backend and admin dashboard

## Architecture

### Backend (Port 3001)
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT tokens
- **Email**: Nodemailer
- **Payment Gateway**: VTPass API

### Admin Dashboard (Port 5000)
- **Framework**: React 19 + Vite
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Mobile App
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **UI**: React Native Paper

## Environment Variables

Required secrets (set in Replit Secrets):
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing
- `VTPASS_USERNAME` - VTPass API username
- `VTPASS_API_KEY` - VTPass API key
- `VTPASS_BASE_URL` - VTPass API endpoint
- `EMAIL_USER` - Email for notifications
- `EMAIL_PASS` - Email password/app password

## Key Features

### User Features
- User registration and authentication
- Wallet funding and management
- Bill payments (electricity, data, TV)
- Transaction history
- Push notifications
- Cashback rewards

### Admin Features
- Dashboard with analytics
- User management
- Wallet credit/debit
- Transaction monitoring
- Broadcast messaging
- Support ticket handling
- Cashback configuration
- VTPass wallet monitoring
- System settings

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Services
- `POST /api/services/electricity` - Pay electricity bill
- `POST /api/services/tv` - Subscribe to TV service

### Transactions
- `GET /api/transactions` - Get user transactions
- `GET /api/transactions/recent` - Get recent transactions

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/analytics` - Analytics data
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:userId/wallet` - Update user wallet
- `PUT /api/admin/users/:userId/status` - Update user status
- `GET /api/admin/transactions` - All transactions
- `POST /api/admin/notifications/broadcast` - Send broadcast message

## Development

### Running Backend
```bash
cd backend
npm install
PORT=3001 node server.js
```

### Running Admin Dashboard
```bash
cd admin-web
npm install
npm run dev
```

### Running Mobile App
```bash
cd frontend
npm install
npx expo start
```

## Deployment

The application is configured to run on Replit with two workflows:
1. **Backend Server** - Runs on port 3001
2. **Admin Dashboard** - Runs on port 5000 (main frontend)

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Admin role verification
- Input validation
- CORS protection
- Environment variable secrets

## User Preferences

- No specific coding preferences set yet
- Standard JavaScript/TypeScript conventions
- React best practices
- RESTful API design

## Next Steps

1. Implement backend routes for support tickets
2. Add cashback automation in transaction processing
3. Integrate real payment gateway for wallet funding
4. Add email/SMS notifications
5. Deploy to production
6. Set up monitoring and analytics

## Notes

- VTPass integration is currently set to sandbox mode
- Mobile app requires Expo Go for testing
- Admin dashboard requires admin role for access
- MongoDB Atlas is used for database (cloud-hosted)
