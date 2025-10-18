# Security Documentation

## Overview
This document outlines the security measures implemented in the VTU Bill Payment application to ensure production-ready security and protect against common vulnerabilities.

## Security Features Implemented

### 1. Authentication & Authorization

#### Email Verification
- **Required for all new accounts**: Users must verify their email address before they can log in
- **OTP-based verification**: 6-digit one-time passwords are sent via email
- **Time-limited codes**: Verification codes expire after 1 hour
- **Resend functionality**: Users can request new verification codes with rate limiting

#### Password Security
- **Bcrypt hashing**: All passwords are hashed using bcrypt with 10 salt rounds
- **Minimum length**: Passwords must be at least 6 characters
- **Secure comparison**: Password verification uses bcrypt.compare() to prevent timing attacks

#### JWT Token Security
- **Expiration**: All JWT tokens expire after 7 days
- **HttpOnly recommended**: Tokens should be stored securely (AsyncStorage for mobile, HttpOnly cookies for web)
- **Secret key**: Uses strong JWT_SECRET from environment variables
- **Token validation**: All protected routes verify token validity and expiration

#### Multi-factor Authentication
- **Email verification**: Required before account access
- **Biometric login**: Optional biometric authentication with same security checks as regular login

### 2. API Security

#### Rate Limiting
Rate limiting prevents brute force attacks and API abuse:

- **Authentication endpoints**: 10 requests per 15 minutes
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/auth/forgot-password`
  - `/api/auth/reset-password`
  - `/api/auth/verify-email`
  - `/api/auth/resend-verification`

#### CORS (Cross-Origin Resource Sharing)
- **Development**: Allows localhost origins for development
- **Production**: Restricted to specific frontend domains
- **Credentials**: CORS configured to allow credentials

#### Security Headers (Helmet)
- **Content Security Policy**: Configured for production
- **XSS Protection**: Enabled via Helmet
- **Frame Options**: Prevents clickjacking
- **HSTS**: HTTP Strict Transport Security enabled in production

### 3. Input Validation & Sanitization

#### Express Validator
All user inputs are validated using express-validator:

- **Email validation**: Verified format and normalized
- **Phone numbers**: Must match 11-digit pattern
- **Amounts**: Validated as numbers with minimum/maximum values
- **Text fields**: Trimmed and length-validated

#### Mongoose Schema Validation
- **Type enforcement**: Mongoose ensures data types match schema
- **Required fields**: Database enforces required fields
- **Unique constraints**: Email addresses must be unique

### 4. Database Security

#### MongoDB Security
- **Connection security**: Uses MongoDB Atlas with encrypted connections
- **Credential management**: Database credentials stored in encrypted environment variables
- **Query protection**: Using Mongoose ORM prevents basic injection attacks
- **Password exclusion**: User passwords are excluded from all queries (`.select('-password')`)

#### Data Protection
- **Sensitive data**: Never logged or exposed in error messages
- **Password reset**: Uses time-limited OTPs instead of password reset links
- **Transaction records**: Immutable once completed

### 5. Error Handling

#### Secure Error Messages
- **Generic errors**: Production errors don't expose system details
- **Stack traces**: Only shown in development environment
- **Input errors**: Validation errors are user-friendly without exposing system internals

#### Error Categories
- `ValidationError`: Input validation failures
- `JsonWebTokenError`: Invalid JWT tokens
- `TokenExpiredError`: Expired JWT tokens
- `CastError`: Invalid MongoDB IDs
- `11000 (Duplicate key)`: Unique constraint violations

### 6. Admin Access Control

#### Role-Based Access Control (RBAC)
- **Admin middleware**: All admin routes protected by `isAdmin` middleware
- **Token verification**: Admin routes require valid JWT token
- **Database validation**: Admin status verified against database for every request

#### Protected Admin Routes
All admin routes use both `verifyToken` and `isAdmin` middleware:
- `/api/admin/stats`
- `/api/admin/users`
- `/api/admin/transactions`
- `/api/admin/analytics/*`
- `/api/admin/notifications/broadcast`

### 7. Payment Security

#### API Key Management
- **Environment variables**: All payment gateway credentials stored securely
- **Never logged**: API keys and secrets never appear in logs
- **Rotation support**: Easy to rotate keys via environment variable updates

#### Payment Gateways
- **Monnify**: Sandbox for development, production keys for deployment
- **VTPass**: Separate credentials for different environments

## Security Best Practices

### For Developers

1. **Never commit secrets**: All secrets must be in environment variables
2. **Use .gitignore**: Ensure `.env` files are never committed
3. **Update dependencies**: Regularly check for security updates
4. **Code review**: All authentication/authorization code should be reviewed
5. **Test security**: Test rate limiting, validation, and authentication flows

### For Deployment

1. **Environment variables**: Set all required secrets in production environment
2. **HTTPS only**: Always use HTTPS in production
3. **Update NODE_ENV**: Set to 'production' for production deployments
4. **Monitor logs**: Watch for suspicious authentication attempts
5. **Regular backups**: Maintain encrypted database backups

### For Users

1. **Strong passwords**: Encourage users to use strong, unique passwords
2. **Email verification**: Required for all accounts
3. **Two-factor**: Biometric authentication available as additional security
4. **Account monitoring**: Users should monitor transaction history

## Environment Variables Required

### Required for Production
```bash
MONGO_URI=<MongoDB connection string>
JWT_SECRET=<Strong random secret>
EMAIL_USER=<Gmail address>
EMAIL_PASS=<Gmail app-specific password>
```

### Payment Gateways
```bash
VTPASS_API_KEY=<VTPass API key>
VTPASS_PUBLIC_KEY=<VTPass public key>
VTPASS_SECRET_KEY=<VTPass secret key>
VTPASS_BASE_URL=<VTPass base URL>
VTPASS_USERNAME=<VTPass username>

MONNIFY_API_KEY=<Monnify API key>
MONNIFY_SECRET_KEY=<Monnify secret key>
MONNIFY_BASE_URL=<Monnify base URL>
MONNIFY_CONTRACT_CODE=<Monnify contract code>
```

## Security Audit Results

### ✅ Strengths
- Passwords hashed with bcrypt (10 rounds)
- All admin routes properly protected
- JWT tokens have expiration (7 days)
- Rate limiting on authentication endpoints
- Input validation using express-validator
- Email verification required
- CORS properly configured
- Helmet security headers enabled
- Secure error handling

### ⚠️ Recommendations for Future Enhancements

1. **Enhanced Rate Limiting**: Consider implementing account lockout after repeated failed login attempts
2. **IP Tracking**: Log IP addresses for suspicious activity monitoring
3. **Session Management**: Implement session invalidation on password change
4. **2FA**: Add optional SMS or authenticator app-based 2FA
5. **Security Logging**: Implement comprehensive audit logging for security events
6. **Input Sanitization**: Add additional sanitization for complex queries in admin routes

## Incident Response

### In Case of Security Breach

1. **Immediate Actions**:
   - Rotate all API keys and secrets
   - Invalidate all JWT tokens
   - Lock affected user accounts
   - Enable maintenance mode if necessary

2. **Investigation**:
   - Check server logs for suspicious activity
   - Review database for unauthorized changes
   - Identify attack vector

3. **Recovery**:
   - Patch vulnerability
   - Restore from backup if needed
   - Force password reset for affected users
   - Notify users if required by law

## Security Contact

For security issues or vulnerabilities, please contact the development team immediately. Do not post security issues publicly.

## Compliance

This application follows security best practices including:
- OWASP Top 10 mitigation
- PCI DSS recommendations for payment handling
- GDPR considerations for user data

## Last Updated

Document last updated: October 18, 2025
Security audit performed: October 18, 2025
