# Admin Dashboard User Guide

## Accessing the Admin Dashboard

The admin dashboard is accessible at the main URL of your Replit deployment.

### Default Login

To create an admin user, you need to manually set a user's role to `'admin'` in the MongoDB database, or register a new user through the API and then update their role.

**Creating an admin user via MongoDB:**
1. Go to your MongoDB Atlas dashboard
2. Browse collections → Find the `users` collection
3. Find or create a user
4. Edit the user document and set `role: "admin"`

**Or use the backend API:**
```bash
# Register a new user
POST /api/auth/register
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}

# Then manually update the role in MongoDB to "admin"
```

---

## Dashboard Features

### 1. Dashboard (Home)
- View total users, transactions, and revenue
- Monitor active users
- See today's statistics
- View recent activity and daily analytics

### 2. User Management
- **Search Users**: Find users by name or email
- **View User Details**: See wallet balance, status, and activity
- **Update Wallet**:
  - Credit (add money) to user wallets
  - Debit (remove money) from user wallets
  - Add reason for the transaction
- **Activate/Deactivate Users**: Enable or disable user accounts

### 3. Transaction Monitoring
- View all platform transactions
- Filter by:
  - Status (success, pending, failed)
  - Type (Electricity, Data, TV, Wallet Funding)
  - Date range
- Export transaction reports
- Monitor transaction trends

### 4. Messaging System
- **Send Broadcast Messages**: Send notifications to all users
- **Message Types**:
  - Info: General information
  - Success: Positive updates
  - Warning: Important alerts
  - Error: Critical issues
  - Promotion: Marketing campaigns
- **Pre-built Templates**: Use ready-made message templates
- **Action Types**: Categorize messages (system, promotion, cashback, wallet)

### 5. Support Center
- View and manage support tickets
- Track ticket status (open, pending, resolved)
- Set priority levels (low, medium, high, urgent)
- Reply to user complaints
- Monitor support metrics

### 6. Cashback Management
- Configure cashback percentages:
  - Data purchases
  - Electricity payments
  - TV subscriptions
- Set minimum transaction amount
- Enable/disable cashback system
- View cashback statistics
- Monitor cashback transactions

### 7. VTPass Wallet
- Monitor VTPass API wallet balance
- Track API spending
- View VTPass transaction history
- Initiate wallet recharge
- Check integration status

### 8. System Settings
- **General Settings**:
  - Application name
  - Maintenance mode
  - User registration toggle
- **Transaction Settings**:
  - Minimum wallet funding
  - Maximum wallet funding
  - Transaction fees
- **Notification Settings**:
  - Email notifications
  - SMS notifications

---

## Common Tasks

### Adding Money to a User's Wallet

1. Go to **Users** page
2. Find the user (use search if needed)
3. Click the dollar ($) icon next to the user
4. Select "Credit" action
5. Enter amount and reason
6. Click "Update Wallet"

### Sending a Promotion

1. Go to **Messages** page
2. Either:
   - Use a template by clicking it
   - Create custom message
3. Fill in title and message
4. Select message type (promotion)
5. Click "Send to All Users"

### Configuring Cashback

1. Go to **Cashback** page
2. Enable cashback system
3. Set percentages for each service type
4. Set minimum transaction amount
5. Click "Save Settings"

### Viewing Transactions

1. Go to **Transactions** page
2. Use filters to narrow down:
   - Status filter
   - Type filter
   - Date range
3. Browse results
4. Use pagination for more records

---

## Important Notes

### Security
- Keep admin credentials secure
- Log out when done
- Don't share admin access
- Review user actions regularly

### VTPass Integration
- Monitor VTPass wallet balance regularly
- Fund wallet before it runs out
- Currently in sandbox mode (for testing)
- Switch to production mode when ready

### Cashback System
- Currently requires manual backend integration
- UI is ready, backend automation pending
- Configure settings now for future use

### Payment Gateway
- Wallet funding is currently in testing mode
- Real payment integration (Paystack/Flutterwave) needed for production
- See MONEY_SYSTEM_DOCUMENTATION.md for details

---

## Troubleshooting

### Can't Login
- Verify user role is set to "admin" in database
- Check email and password are correct
- Ensure backend server is running

### Users Not Showing
- Check backend connection
- Verify MongoDB is accessible
- Check browser console for errors

### Transactions Not Loading
- Verify backend API is running
- Check network tab for failed requests
- Ensure proper authentication

### Messages Not Sending
- Check backend logs
- Verify notification service is configured
- Ensure users exist in database

---

## Production Deployment Checklist

Before going live:

- [ ] Create proper admin account(s)
- [ ] Switch VTPass to production mode
- [ ] Integrate real payment gateway
- [ ] Set up email service (SendGrid/Mailgun)
- [ ] Configure SMS service (optional)
- [ ] Set up monitoring and alerts
- [ ] Test all features thoroughly
- [ ] Review security settings
- [ ] Back up database
- [ ] Document admin procedures

---

## Support

For technical issues or questions:
- Review MONEY_SYSTEM_DOCUMENTATION.md for system architecture
- Check replit.md for project structure
- Contact your development team for assistance

---

## Version Information

- Admin Dashboard: v1.0.0
- Last Updated: October 18, 2025
- Framework: React + Vite
- Backend: Node.js + Express + MongoDB
