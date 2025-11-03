# Email Verification Admin Guide

## Overview
This guide explains how to use the new admin panel features for managing email verification issues.

## Features Added

### 1. Email Testing (Settings Page)

Navigate to **Settings** in the admin panel to access the email testing tool.

**Features:**
- Send test emails to any address to verify email service is working
- Test different email types:
  - Basic Test Email
  - Verification Email (with OTP code)
  - Password Reset Email
  - Welcome Email

**How to Use:**
1. Go to Settings page in admin panel
2. Scroll to "Email Service Testing" section
3. Enter the recipient email address
4. Select the email type to test
5. Click "Send Test Email"
6. Check the result message for success or errors

**Troubleshooting:**
- If you see "Email service not configured" error, verify that `EMAIL_USER` and `EMAIL_PASS` environment variables are set correctly
- Check the backend server logs for detailed error messages

### 2. Unverified Users Management

Navigate to **Unverified Users** in the admin panel to manage users stuck in email verification.

**Features:**
- View all users who haven't verified their email addresses
- See when each user registered and when their verification code expires
- Manually verify users when email service fails
- Pagination support for large user lists

**How to Manually Verify a User:**
1. Go to "Unverified Users" page in admin panel
2. Find the user you want to verify
3. Click "Manual Verify" button next to their email
4. Confirm the action when prompted
5. Enter a reason for manual verification (e.g., "Email service was down")
6. The user will be verified and can now log in

**Important Notes:**
- Manual verification should only be used when:
  - Email service is temporarily unavailable
  - User reports not receiving verification emails
  - Verification code has expired
- All manual verifications are logged for security auditing

## API Endpoints

### Test Email Sending
```bash
POST /api/admin/security/test-email
Headers: Authorization: Bearer <admin_token>
Body: {
  "to": "email@example.com",
  "testType": "verification" // or "basic", "password_reset", "welcome"
}
```

### Get Unverified Users
```bash
GET /api/admin/security/unverified-users?page=1&limit=20
Headers: Authorization: Bearer <admin_token>
```

### Manual Email Verification
```bash
POST /api/admin/security/manual-verify-email
Headers: Authorization: Bearer <admin_token>
Body: {
  "email": "user@example.com",
  "reason": "Email service was down"
}
```

### Resend Verification Email (User-facing)
```bash
POST /api/auth/resend-verification
Body: {
  "email": "user@example.com"
}
```

## Workflow

### When a User Reports Email Not Received:

1. **First, test if email service is working:**
   - Go to Settings → Email Service Testing
   - Send a test verification email to your own email
   - If it fails, check EMAIL_USER and EMAIL_PASS environment variables

2. **If email service is working:**
   - User should try "Resend Verification" in the mobile app
   - Check "Unverified Users" page to confirm user exists

3. **If email service is not working:**
   - Use "Manual Verify" feature in "Unverified Users" page
   - Provide a clear reason for the manual verification
   - Notify the user that their email has been verified

4. **For new users during email outage:**
   - They can still create accounts
   - Use the manual verification feature to verify them
   - Once email service is restored, new users will receive emails automatically

## Email Service Configuration

The backend uses Gmail SMTP for sending emails. Ensure these environment variables are set:

- `EMAIL_USER`: Gmail address (e.g., yourapp@gmail.com)
- `EMAIL_PASS`: Gmail app password (not your regular password)

**To create a Gmail app password:**
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account → Security → App passwords
3. Generate a new app password for "Mail"
4. Use this password in the EMAIL_PASS environment variable

## Security Notes

- Email testing endpoint is protected by admin authentication
- All manual verifications are logged with admin ID, timestamp, and reason
- Only admins can access unverified users list and manual verification features
- Rate limiting is applied to prevent abuse

## Testing the Complete Flow

To verify everything is working:

1. **Register a test user via API:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

2. **Check email was sent:**
   - Look for the email in the test inbox
   - Check backend logs for "Email sent successfully"

3. **If email not received:**
   - Go to admin panel → Unverified Users
   - Find the test user
   - Use "Manual Verify" to verify them
   - User can now log in

4. **Test email service:**
   - Go to admin panel → Settings
   - Use "Email Service Testing" to send a test email
   - Verify you receive it

## Support

If you continue to have email issues after following this guide:
1. Check backend server logs for detailed error messages
2. Verify EMAIL_USER and EMAIL_PASS are correctly set
3. Ensure Gmail allows "less secure app access" or use an app password
4. Check if your Gmail account has 2FA enabled and use app password
