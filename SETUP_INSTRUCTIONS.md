# Setup Instructions for VTU Bill Payment App

## Overview
This is a complete VTU (Virtual Top-Up) bill payment application with:
- **Backend API**: Node.js/Express REST API (Port 3001)
- **Frontend**: React Native mobile app (Expo)
- **Admin Dashboard**: React web dashboard (embedded in backend for production)

## Architecture
- **Mobile App (Frontend)**: Users can pay bills, top up, manage wallet
- **Backend API**: Handles authentication, payments, transactions
- **MongoDB**: Database for users, transactions, and data
- **Email Service**: Gmail SMTP for verification emails
- **Payment Gateways**: VTPass (bills) and Monnify (wallet funding)

---

## Quick Start (Replit Environment)

### 1. Backend is Already Running!
The backend server is configured and running on port 3001. You can see the API health check at:
```
http://localhost:3001/api/health
```

### 2. Environment Variables
All secrets have been configured in Replit's encrypted secrets system. The following environment variables are set:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASS` - Gmail app-specific password
- VTPass API credentials
- Monnify payment gateway credentials

### 3. Testing the Email Verification Flow

#### A. Test Registration (via mobile app or API client)
```bash
# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@gmail.com",
    "password": "password123"
  }'

# Response: You'll receive a success message and should get a 6-digit verification code via email
```

#### B. Check Your Email
Look for an email from "VTU Bill Payment" with subject "Verify Your Email Address" containing a 6-digit code.

#### C. Verify Your Email
```bash
# Verify email with the code you received
curl -X POST http://localhost:3001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "otp": "123456"
  }'

# Response: You'll receive a JWT token and can now log in
```

#### D. Login
```bash
# Now you can login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "password": "password123"
  }'

# Response: JWT token and user data
```

---

## Running the Frontend (Mobile App)

### Option 1: Expo Go (Recommended for Testing)
```bash
cd frontend
npm install
npm start
```

Then:
1. Install "Expo Go" app on your phone (iOS or Android)
2. Scan the QR code displayed in the terminal
3. The app will load on your device

### Option 2: iOS Simulator (Mac only)
```bash
cd frontend
npm install
npm run ios
```

### Option 3: Android Emulator
```bash
cd frontend
npm install
npm run android
```

### Option 4: Web Browser (for testing only)
```bash
cd frontend
npm install
npm run web
```

**Note**: The frontend needs to connect to the backend API. The API URL is configured in `frontend/constants/api.ts`.

---

## Admin Dashboard

The admin dashboard is built into the backend for production deployment.

### For Development:
```bash
cd backend/admin-web
npm install
npm run dev
```
Access at: `http://localhost:5173`

### For Production:
The admin dashboard is automatically built and served from the backend in production mode.

---

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user and send verification email.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
```

#### POST `/api/auth/verify-email`
Verify email with OTP code.
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### POST `/api/auth/resend-verification`
Resend verification code.
```json
{
  "email": "john@example.com"
}
```

#### POST `/api/auth/login`
Login with email and password (requires verified email).
```json
{
  "email": "john@example.com",
  "password": "secure123"
}
```

#### POST `/api/auth/forgot-password`
Request password reset code.
```json
{
  "email": "john@example.com"
}
```

#### POST `/api/auth/reset-password`
Reset password with OTP.
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newsecure123"
}
```

### Protected Endpoints (Require JWT Token)

Include token in headers:
```
Authorization: Bearer <your-jwt-token>
```

#### GET `/api/auth/profile`
Get user profile information.

#### GET `/api/auth/wallet`
Get wallet balance.

#### POST `/api/auth/wallet/fund`
Fund wallet.

#### GET `/api/transactions`
Get transaction history.

---

## Security Features Implemented

### ✅ Email Verification
- All users must verify their email before they can log in
- 6-digit OTP codes sent via email
- Codes expire after 1 hour
- Rate-limited verification attempts

### ✅ Authentication Security
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Rate limiting on auth endpoints (10 attempts per 15 minutes)
- Email verification required before login

### ✅ API Security
- Rate limiting on all authentication endpoints
- CORS configured with strict origin checking
- Helmet security headers
- Input validation using express-validator
- Secure error handling (no information leakage)

### ✅ Admin Protection
- All admin routes require both authentication and admin role
- Role-based access control (RBAC)
- Database validation on every request

---

## Troubleshooting

### Email Verification Not Working

**Check Gmail App Password:**
1. Go to Google Account Settings → Security
2. Enable 2-Factor Authentication if not enabled
3. Generate an App Password (not your regular Gmail password)
4. Use this app password as `EMAIL_PASS`

**Check Spam Folder:**
Verification emails might end up in spam. Check your spam folder.

**Resend Verification Code:**
Use the `/api/auth/resend-verification` endpoint to get a new code.

### Backend Not Running

Check the workflow logs in Replit to see if there are any errors. Common issues:
- MongoDB connection failed (check `MONGO_URI`)
- Missing environment variables (check all secrets are set)

### Frontend Can't Connect to Backend

Make sure the API URL in `frontend/constants/api.ts` points to the correct backend URL.

---

## Environment-Specific Configuration

### Development
- `NODE_ENV=development` (default)
- CORS allows all localhost origins
- Error messages include stack traces

### Production
Set environment variables:
- `NODE_ENV=production`
- `FRONTEND_URL=https://your-frontend-domain.com`
- `ADMIN_URL=https://your-admin-domain.com`
- All other secrets (same as development but production credentials)

---

## Next Steps

1. **Test the Email Verification Flow**: Register a new account and verify it works
2. **Test the Mobile App**: Run the frontend and test the full user flow
3. **Create an Admin Account**: Use the script in `backend/scripts/createAdmin.js`
4. **Configure Payment Gateways**: Update to production credentials when ready
5. **Review Security Documentation**: See `SECURITY.md` for security best practices

---

## Support

For issues or questions:
1. Check the logs in Replit
2. Review `SECURITY.md` for security information
3. Check the codebase documentation in `replit.md`

---

## Production Deployment

When ready for production:
1. Set `NODE_ENV=production`
2. Update payment gateway credentials to production
3. Set `FRONTEND_URL` and `ADMIN_URL` environment variables
4. Enable HTTPS (required)
5. Set up database backups
6. Monitor logs for security events

See `SECURITY.md` for complete production deployment checklist.
