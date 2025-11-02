# Password Reset Flow Documentation

## Overview
The password reset system uses a secure OTP (One-Time Password) verification via email, allowing users to safely reset their passwords.

## Complete Flow

### Step 1: Request Password Reset
**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset code sent to your email"
}
```

**Error Responses:**
- `404`: No account found with that email
- `503`: Email service unavailable (code generated, contact support)
- `500`: Email sending failed (try again or contact support)

**What Happens:**
1. System generates a random 6-digit OTP code
2. OTP is stored in the database with 1-hour expiration
3. Email is sent to the user with the OTP code
4. User receives email with verification code

---

### Step 2: Verify OTP and Set New Password
**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

**Error Responses:**
- `400`: Missing required fields (email, otp, newPassword)
- `400`: Invalid or expired verification code

**What Happens:**
1. System validates the OTP matches and hasn't expired (1-hour limit)
2. New password is hashed using bcrypt
3. Password is updated in the database
4. OTP and expiry are cleared from the database
5. User can now login with the new password

---

## Security Features

### OTP Security
- **Random Generation**: 6-digit codes (100,000 - 999,999)
- **One-Time Use**: OTP is deleted after successful reset
- **Time-Limited**: Expires after 1 hour
- **Rate Limited**: Protected by authentication rate limiting

### Password Security
- **Bcrypt Hashing**: Passwords hashed with bcrypt (10 rounds)
- **No Plain Text**: Original password never stored
- **Validation**: Password requirements enforced by frontend

### Email Delivery
- **Fail-Fast**: Immediate error if email service unavailable
- **Clear Feedback**: Users know if email was sent or failed
- **Support Guidance**: Contact info provided when email fails

---

## Frontend Implementation Guide

### Screen Flow
1. **Forgot Password Screen**
   - User enters email
   - Submit to `/api/auth/forgot-password`
   - Show loading state during email sending
   - Navigate to verification screen on success

2. **Reset Password Verification Screen**
   - Display OTP input (6 digits)
   - Display new password input
   - Display confirm password input
   - Submit both OTP and new password to `/api/auth/reset-password`
   - Navigate to login screen on success

### Error Handling
```javascript
try {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Navigate to OTP verification screen
    navigation.navigate('ResetPasswordVerification', { email });
  } else {
    // Show error message
    if (data.errorCode === 'EMAIL_SERVICE_UNAVAILABLE') {
      alert(`Email service unavailable. Contact ${data.supportEmail} for assistance.`);
    } else {
      alert(data.message);
    }
  }
} catch (error) {
  alert('Network error. Please try again.');
}
```

---

## Testing

### Manual Test (using curl)

**Step 1: Request Reset**
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Step 2: Check Email for OTP**
(Check the email inbox or server logs for the 6-digit code)

**Step 3: Reset Password**
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "newPassword": "NewPassword123!"
  }'
```

**Step 4: Login with New Password**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "NewPassword123!"
  }'
```

---

## Email Template

The password reset email includes:
- User's name
- 6-digit OTP code (large, centered, easy to read)
- 1-hour expiration notice
- Security warning if user didn't request reset

---

## Common Issues & Solutions

### Issue: Email Not Received
**Solutions:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check server logs for email sending errors
4. Contact support if email service is down

### Issue: "Invalid or Expired Code"
**Solutions:**
1. Request a new code (OTPs expire after 1 hour)
2. Ensure OTP is entered correctly (6 digits)
3. Don't use the same OTP twice

### Issue: Email Service Unavailable
**Solutions:**
1. Server returns clear error message
2. OTP is still generated and stored in database
3. Admin can manually retrieve OTP from database or verify user
4. User should contact support for assistance

---

## Admin Tools

### Manual Password Reset (if email fails)
Admins can manually verify users through the admin security panel:
- View unverified users
- Manually verify email addresses
- Access user OTPs in database (if needed)

---

## Status
✅ **Fully Implemented and Tested**
- Email sending working
- OTP generation and validation working
- Password hashing working
- Error handling comprehensive
- Security measures in place
