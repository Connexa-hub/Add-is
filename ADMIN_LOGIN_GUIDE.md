# Admin Dashboard Login Guide

## ✅ Project Successfully Imported and Running

The VTU Bill Payment Platform (Connexa) is now fully operational in Replit!

---

## 🔐 Admin Dashboard Access

**Login Credentials:**
- **Email**: `admin@example.com`
- **Password**: `Admin123!`

**Access URL:**
- The admin dashboard is running on port 5000
- Click the webview button in Replit to access it
- You'll see the login page with the Connexa logo

---

## 📊 What's Available After Login

Once you log in, you'll have access to the following pages:

### Main Features:
1. **Dashboard** - Overview with stats (revenue, users, transactions)
2. **Users** - Manage all user accounts
3. **KYC Management** - Review and approve/reject user KYC submissions
4. **Banners** - Create and manage promotional banners
5. **VTU Products** - Manage airtime, data, and other VTU products
6. **Transactions** - Monitor all payment transactions
7. **Payment Integration** - VTPass and Monnify integration status
8. **Cashback** - Configure cashback rewards
9. **Messages** - Broadcast messages to users
10. **Support** - Handle customer support tickets
11. **Settings** - System configuration

---

## 🎨 Layout & Styling

The admin dashboard features:
- **Modern gradient sidebar** with collapsible menu
- **Responsive design** with Tailwind CSS
- **Professional card-based layout** with shadows and hover effects
- **Color-coded stats** with animated counters
- **Clean table designs** for data display
- **Beautiful modal windows** for forms
- **Smooth transitions** and animations throughout

### Color Scheme:
- **Primary**: Cyan (#2BE2FA) - Used for main actions
- **Secondary**: Green (#10B981) - Used for success states
- **Gradient**: Purple to Blue background

---

## 🚀 All Opay-Style Features Implemented

The platform includes everything requested:

### ✅ Authentication & KYC
- Multi-step KYC flow (personal info → documents → selfie → review)
- Admin approval/rejection workflow
- Unverified user banners on mobile app

### ✅ VTU Features
- Network auto-detection from phone numbers (MTN, GLO, AIRTEL, 9MOBILE)
- Product catalog with filtering and search
- Category grouping
- Commission tracking

### ✅ Banner Management
- Create banners with images/videos/GIFs
- Multi-section targeting (home, airtime, data, etc.)
- Schedule banners with start/end dates
- Weight-based randomization
- Impression and click tracking

### ✅ Wallet & Payments
- Monnify integration for card payments
- Card tokenization and vault
- PIN-protected card reveal
- Virtual account transfers
- Transaction PIN with lockout protection

### ✅ Security
- JWT authentication
- Rate limiting
- Email verification
- PIN-based authorization
- Biometric toggle

---

## 🛠️ Technical Details

**Backend (Port 3001):**
- Node.js + Express
- MongoDB (Atlas)
- All API endpoints working
- No errors in logs

**Frontend (Port 5000):**
- React 19 + Vite
- Tailwind CSS
- React Router v7
- Lucide icons

**Mobile App:**
- React Native + Expo
- Available in `/frontend` folder
- Run with: `cd frontend && npx expo start`

---

## 📱 Testing the Mobile App

If you want to test the mobile features:

```bash
cd frontend
npx expo start
```

Then:
1. Install Expo Go on your phone
2. Scan the QR code
3. Test KYC flow, wallet funding, banners, etc.

---

## ⚠️ Important Notes

1. **Change Admin Password**: After first login, change the default password
2. **Sandbox Mode**: VTPass and Monnify are in sandbox mode
3. **MongoDB**: Connected to Atlas (cloud database)
4. **Environment**: All secrets are configured in Replit

---

## 💡 Next Steps

1. Log in to the admin dashboard
2. Explore the KYC management page
3. Create some test banners
4. Add VTU products
5. Review the mobile app screens
6. Configure payment gateways for production when ready

---

## 🐛 If You See Layout Issues

The dashboard uses Tailwind CSS with custom styles defined in `backend/admin-web/src/index.css`. If anything looks broken:

1. Check browser console for errors
2. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cache
4. Verify the CSS file is loading

The layout should show:
- Dark sidebar on the left with menu items
- White main content area
- Gradient buttons and cards
- Professional spacing and typography

---

## 📞 Support

If you need help:
1. Check the logs in Replit (Backend API and Admin Dashboard workflows)
2. Review `SETUP_INSTRUCTIONS.md` for API testing
3. See `SECURITY.md` for security features
4. Check `replit.md` for project documentation
