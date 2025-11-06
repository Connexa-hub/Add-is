
# Connexa VTU Bill Payment Platform

A complete VTU (Virtual Top-Up) bill payment platform with React Native mobile app and admin dashboard.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- VTPass API credentials (sandbox/production)
- Monnify API credentials (sandbox/production)

### Environment Setup

1. **Backend Setup**
```bash
cd backend
npm install
```

2. **Configure Environment Variables**
Create `backend/.env` with:
```env
# Database
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# VTPass
VTPASS_USERNAME=your_username
VTPASS_API_KEY=your_api_key
VTPASS_BASE_URL=https://sandbox.vtpass.com/api

# Monnify
MONNIFY_API_KEY=your_api_key
MONNIFY_SECRET_KEY=your_secret_key
MONNIFY_CONTRACT_CODE=your_contract_code
MONNIFY_BASE_URL=https://sandbox.monnify.com

# Email
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# Server
NODE_ENV=production
PORT=5000
```

3. **Start Backend + Admin**
```bash
cd backend
npm start
```

Backend API: http://0.0.0.0:3001
Admin Dashboard: http://0.0.0.0:5000

### Mobile App Setup

```bash
cd frontend
npm install
npx expo start
```

Scan QR code with Expo Go app on your device.

## Default Admin Credentials
- Email: `admin@example.com`
- Password: `Admin123!`

Change these immediately after first login!

## Project Structure

```
├── backend/          # Node.js/Express API + Admin Dashboard
├── frontend/         # React Native mobile app
└── docs/            # Core documentation
```

## Core Features

- User authentication with email verification
- KYC verification system
- Wallet management
- VTU services (Airtime, Data, TV, Electricity, etc.)
- Transaction PIN & biometric auth
- Card vault (PCI compliant)
- Admin dashboard
- Payment gateway integration (Monnify)
- VTPass bill payment integration

## Documentation

- **[SECURITY.md](SECURITY.md)** - Security implementation details
- **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** - Detailed setup guide
- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** - Admin dashboard usage
- **[OPAY_FEATURES_API.md](OPAY_FEATURES_API.md)** - API documentation
- **[replit.md](replit.md)** - Project overview and architecture

## Deployment

The project is configured for Replit deployment:
- Backend runs on port 5000 (serves both API and admin)
- MongoDB Atlas for database
- All secrets via environment variables

## Support

For issues or questions, check the documentation in the root directory.

## License

Proprietary - Connexa VTU Platform
