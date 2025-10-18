# VTU Bill Payment Money System Documentation

## Overview

This document provides a comprehensive explanation of how the money and transaction system works in the VTU Bill Payment platform, including wallet management, VTPass integration, cashback, and what's needed to make it production-ready.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Wallet System](#wallet-system)
3. [Transaction Flow](#transaction-flow)
4. [VTPass Integration](#vtpass-integration)
5. [Cashback System](#cashback-system)
6. [Payment Gateway Integration](#payment-gateway-integration)
7. [Security Measures](#security-measures)
8. [Production Readiness Checklist](#production-readiness-checklist)
9. [Testing Guidelines](#testing-guidelines)

---

## System Architecture

### Database Models

#### 1. User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['user', 'admin']),
  walletBalance: Number (default: 0),
  virtualAccountNumber: String (auto-generated),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Transaction Model
```javascript
{
  userId: ObjectId (ref: User),
  type: String (e.g., 'Electricity', 'Data', 'TV', 'Wallet Funding'),
  transactionType: String ('credit' or 'debit'),
  amount: Number,
  reference: String (unique),
  recipient: String (meter number, phone number, etc.),
  status: String (enum: ['pending', 'success', 'failed']),
  details: Object (VTPass response or additional info),
  createdAt: Date
}
```

#### 3. Notification Model
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  message: String,
  type: String (enum: ['info', 'success', 'warning', 'error', 'promotion']),
  isRead: Boolean (default: false),
  actionType: String (enum: ['transaction', 'promotion', 'system', 'cashback', 'wallet']),
  actionData: Mixed,
  createdAt: Date
}
```

---

## Wallet System

### How It Works

1. **Wallet Balance Storage**
   - Each user has a `walletBalance` field in their User document
   - Balance is stored as a Number (in the smallest currency unit - kobo/cents)
   - All operations use atomic updates to prevent race conditions

2. **Wallet Funding Flow**
   ```
   User initiates funding → Payment gateway → Payment confirmation → 
   Wallet credited → Transaction record created → User notified
   ```

3. **Current Implementation**
   - **Backend**: `walletController.js`
   - **Endpoint**: `POST /api/wallet/fund`
   - **Process**:
     ```javascript
     1. Validate amount (minimum/maximum limits)
     2. Create transaction record (status: 'pending')
     3. Process payment (currently auto-success for testing)
     4. Update user wallet balance
     5. Update transaction status to 'success'
     6. Send notification to user
     ```

### Admin Wallet Management

Admins can directly credit or debit user wallets:

- **Credit**: Add money to user's wallet
- **Debit**: Remove money from user's wallet
- All admin actions are logged in the Transaction table
- Reason field is required for auditing

**Endpoint**: `PUT /api/admin/users/:userId/wallet`

```javascript
{
  action: 'credit' | 'debit',
  amount: Number,
  reason: String
}
```

---

## Transaction Flow

### 1. User Initiates Transaction

```
User selects service → Enters details → Confirms →
System checks wallet balance → Processes with VTPass →
Updates wallet → Records transaction → Sends notification
```

### 2. Electricity Payment Flow

**File**: `backend/controllers/serviceController.js`

```javascript
1. User submits:
   - Meter number
   - Service ID (e.g., 'ikeja-electric')
   - Variation code (prepaid/postpaid)
   - Amount

2. System validates:
   - User authentication
   - Wallet balance >= amount
   - Meter number format

3. Create transaction reference: `ELEC-{UUID}`

4. Call VTPass API:
   - Send payment request
   - Wait for response

5. VTPass response:
   - Success (code: '000') → Debit wallet → Save transaction
   - Failed → Don't debit → Save failed transaction

6. Return response to user with token/receipt
```

### 3. Data Purchase Flow

Similar to electricity but with different parameters:
- Phone number instead of meter number
- Network provider (MTN, Airtel, Glo, 9mobile)
- Data plan variation code

### 4. TV Subscription Flow

Parameters:
- Smartcard number
- Service provider (DSTV, GOTV, Startimes)
- Subscription package

---

## VTPass Integration

### What is VTPass?

VTPass is a Nigerian bill payment API that handles:
- Electricity payments (all DISCOs)
- Airtime and data purchases
- TV subscriptions (DSTV, GOTV, etc.)
- Bulk SMS
- And more

### Integration Details

**File**: `backend/utils/vtpassClient.js`

```javascript
// Authentication
const getAuthHeaders = () => {
  const token = Buffer.from(
    `${process.env.VTPASS_USERNAME}:${process.env.VTPASS_API_KEY}`
  ).toString('base64');
  
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json'
  };
};

// API Request
const requestVTPass = async (serviceID, params) => {
  const payload = {
    request_id: uuid.v4(), // Unique transaction ID
    serviceID, // e.g., 'ikeja-electric'
    ...params
  };
  
  const { data } = await axios.post(
    `${process.env.VTPASS_BASE_URL}/pay`,
    payload,
    { headers: getAuthHeaders() }
  );
  
  return data;
};
```

### VTPass Response Format

```javascript
{
  code: '000', // Success code
  content: {
    transactions: {
      status: 'delivered',
      product_name: 'Ikeja Electric',
      unique_element: 'meter_number',
      unit_price: amount,
      quantity: 1,
      token: '1234-5678-9012-3456' // For prepaid meters
    }
  },
  response_description: 'TRANSACTION SUCCESSFUL',
  requestId: 'reference',
  amount: amount,
  transaction_date: {...},
  purchased_code: 'token'
}
```

### VTPass Wallet Management

- VTPass maintains a separate wallet for API transactions
- You must fund this wallet separately via their dashboard
- Check balance periodically to ensure sufficient funds
- Set up low balance alerts

**Current Implementation**:
- Admin dashboard has VTPass wallet monitoring page
- Shows current balance (requires API integration)
- Allows tracking of API usage

---

## Cashback System

### How It Should Work

1. **Configuration** (Admin Dashboard)
   - Set percentage per service type:
     - Data purchases: X%
     - Electricity: Y%
     - TV subscriptions: Z%
   - Set minimum transaction amount for cashback eligibility
   - Enable/disable cashback system

2. **Automatic Cashback Processing**
   ```javascript
   // After successful transaction
   if (cashbackEnabled && amount >= minimumAmount) {
     const cashbackAmount = amount * (cashbackPercentage / 100);
     
     // Credit user wallet
     user.walletBalance += cashbackAmount;
     await user.save();
     
     // Create cashback transaction record
     await Transaction.create({
       userId: user._id,
       type: 'Cashback',
       transactionType: 'credit',
       amount: cashbackAmount,
       reference: `CASHBACK-${reference}`,
       status: 'success',
       details: {
         originalTransaction: reference,
         cashbackPercentage
       }
     });
     
     // Send notification
     await Notification.create({
       userId: user._id,
       title: 'Cashback Received!',
       message: `You received ₦${cashbackAmount} cashback`,
       type: 'success',
       actionType: 'cashback'
     });
   }
   ```

3. **Current Status**
   - ✅ UI implementation complete
   - ❌ Backend automation not yet implemented
   - ❌ Cashback model not created
   - ❌ No cashback tracking

---

## Payment Gateway Integration

### Current Implementation (Testing Only)

The current wallet funding system **auto-approves** transactions for testing purposes. This is **NOT production-ready**.

```javascript
// backend/controllers/walletController.js
exports.fundWallet = async (req, res, next) => {
  // WARNING: This immediately credits the wallet without actual payment
  user.walletBalance += amount;
  await user.save();
  
  // Transaction marked as 'success' immediately
  transaction.status = 'success';
};
```

### Production-Ready Implementation

You need to integrate a real payment gateway. Popular options in Nigeria:

#### 1. Paystack (Recommended)

**Setup**:
```bash
npm install paystack
```

**Implementation**:
```javascript
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

exports.initiateFunding = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.userId);
    
    // Initialize Paystack transaction
    const response = await paystack.transaction.initialize({
      email: user.email,
      amount: amount * 100, // Convert to kobo
      callback_url: `${process.env.APP_URL}/api/wallet/verify`,
      metadata: {
        userId: user._id,
        custom_fields: [
          {
            display_name: 'Wallet Funding',
            variable_name: 'wallet_funding',
            value: amount
          }
        ]
      }
    });
    
    // Create pending transaction
    await Transaction.create({
      userId: user._id,
      type: 'Wallet Funding',
      transactionType: 'credit',
      amount,
      reference: response.data.reference,
      status: 'pending'
    });
    
    res.json({
      success: true,
      data: {
        authorization_url: response.data.authorization_url,
        reference: response.data.reference
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyFunding = async (req, res, next) => {
  try {
    const { reference } = req.query;
    
    // Verify transaction with Paystack
    const response = await paystack.transaction.verify(reference);
    
    if (response.data.status === 'success') {
      // Find pending transaction
      const transaction = await Transaction.findOne({ reference });
      const user = await User.findById(transaction.userId);
      
      // Credit wallet
      user.walletBalance += transaction.amount;
      await user.save();
      
      // Update transaction status
      transaction.status = 'success';
      await transaction.save();
      
      // Send notification
      await Notification.create({
        userId: user._id,
        title: 'Wallet Funded',
        message: `Your wallet has been credited with ₦${transaction.amount}`,
        type: 'success',
        actionType: 'wallet'
      });
      
      res.redirect(`${process.env.APP_URL}/wallet-success`);
    } else {
      res.redirect(`${process.env.APP_URL}/wallet-failed`);
    }
  } catch (error) {
    next(error);
  }
};
```

#### 2. Flutterwave

**Setup**:
```bash
npm install flutterwave-node-v3
```

**Implementation**: Similar to Paystack with Flutterwave SDK

#### 3. Monnify

Good for virtual accounts and direct bank transfers.

---

## Security Measures

### 1. Authentication & Authorization

```javascript
// JWT Token Verification
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin Role Check
const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId);
  
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};
```

### 2. Input Validation

```javascript
// Example: Validate wallet funding
const validateFunding = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 100, max: 100000 })
    .withMessage('Amount must be between ₦100 and ₦100,000'),
  
  body('paymentMethod')
    .isIn(['card', 'bank_transfer'])
    .withMessage('Invalid payment method')
];
```

### 3. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

### 4. Transaction Integrity

- Use database transactions for wallet operations
- Implement optimistic locking
- Log all financial operations
- Regular audits of transaction records

---

## Production Readiness Checklist

### Required Integrations

- [ ] **Payment Gateway** (Paystack/Flutterwave/Monnify)
  - [ ] Wallet funding
  - [ ] Payment verification webhooks
  - [ ] Refund processing
  
- [ ] **VTPass Production Account**
  - [ ] Switch from sandbox to production
  - [ ] Update `VTPASS_BASE_URL` to `https://vtpass.com/api`
  - [ ] Fund VTPass wallet
  - [ ] Set up webhook for balance alerts

- [ ] **Email Service**
  - [ ] Configure SendGrid/Mailgun for production
  - [ ] Set up email templates
  - [ ] Transaction receipts
  - [ ] Welcome emails
  - [ ] Password reset emails

- [ ] **SMS Service** (Optional)
  - [ ] Integrate SMS provider (Termii, Africa's Talking)
  - [ ] Transaction alerts
  - [ ] OTP verification

### Backend Enhancements

- [ ] **Error Handling**
  - [ ] Global error handler
  - [ ] Proper error logging (Winston/Morgan)
  - [ ] Error tracking (Sentry)

- [ ] **Monitoring**
  - [ ] Application monitoring (New Relic/Datadog)
  - [ ] Database monitoring
  - [ ] API performance tracking
  - [ ] Uptime monitoring

- [ ] **Security**
  - [ ] Rate limiting on all endpoints
  - [ ] Input sanitization
  - [ ] SQL injection prevention
  - [ ] XSS protection
  - [ ] HTTPS enforcement
  - [ ] Security headers (helmet)

- [ ] **Database**
  - [ ] Indexes on frequently queried fields
  - [ ] Backup strategy
  - [ ] Database replication
  - [ ] Connection pooling

- [ ] **Cashback System**
  - [ ] Create Cashback model
  - [ ] Implement automatic cashback after successful transactions
  - [ ] Admin controls for cashback rates
  - [ ] Cashback history and reports

### Frontend Enhancements

- [ ] **Mobile App**
  - [ ] Push notifications (Firebase)
  - [ ] Biometric authentication
  - [ ] Offline support
  - [ ] App store deployment (iOS/Android)

- [ ] **Admin Dashboard**
  - [ ] Real-time analytics
  - [ ] Export reports (CSV/PDF)
  - [ ] Advanced filtering
  - [ ] Bulk operations

### Testing

- [ ] **Unit Tests**
  - [ ] Controller tests
  - [ ] Model tests
  - [ ] Utility function tests

- [ ] **Integration Tests**
  - [ ] API endpoint tests
  - [ ] Payment flow tests
  - [ ] VTPass integration tests

- [ ] **E2E Tests**
  - [ ] User registration to transaction
  - [ ] Admin workflows
  - [ ] Payment flows

### Infrastructure

- [ ] **Deployment**
  - [ ] Production server setup
  - [ ] CI/CD pipeline
  - [ ] Environment variable management
  - [ ] SSL certificates

- [ ] **Scaling**
  - [ ] Load balancing
  - [ ] Caching (Redis)
  - [ ] CDN for static assets
  - [ ] Database indexing

### Legal & Compliance

- [ ] **Regulatory**
  - [ ] PCI DSS compliance (for card payments)
  - [ ] Data protection compliance (NDPR in Nigeria)
  - [ ] Terms of Service
  - [ ] Privacy Policy

- [ ] **Financial**
  - [ ] Business registration
  - [ ] Payment gateway merchant account
  - [ ] Bank account for settlements
  - [ ] Accounting system integration

---

## Testing Guidelines

### 1. Testing Wallet Operations

```bash
# Fund wallet (currently auto-success)
curl -X POST http://localhost:3001/api/wallet/fund \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "paymentMethod": "card"}'

# Check balance
curl http://localhost:3001/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Testing VTPass Integration

```bash
# Pay electricity (sandbox mode)
curl -X POST http://localhost:3001/api/services/electricity \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meterNumber": "1111111111111",
    "serviceID": "ikeja-electric",
    "variation_code": "prepaid",
    "amount": 1000
  }'
```

### 3. Admin Testing

```bash
# Get admin stats
curl http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Credit user wallet
curl -X PUT http://localhost:3001/api/admin/users/USER_ID/wallet \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "credit",
    "amount": 1000,
    "reason": "Test credit"
  }'
```

---

## Cost Estimates

### Monthly Operating Costs (Estimated)

1. **Infrastructure**
   - Server hosting: $10-50/month (depends on traffic)
   - Database (MongoDB Atlas): $0-57/month
   - CDN: $5-20/month

2. **Services**
   - Email service: $0-15/month (SendGrid free tier available)
   - SMS service: Pay-per-use (~₦2-5 per SMS)
   - Monitoring: $0-30/month

3. **Payment Gateway Fees**
   - Paystack: 1.5% + ₦100 per transaction
   - Flutterwave: Similar rates
   - Minimum: Calculate based on volume

4. **VTPass**
   - No monthly fee
   - Charges per transaction (varies by service)
   - Must maintain funded wallet

**Total Estimated**: $50-200/month + transaction fees

---

## Support & Maintenance

### Regular Tasks

1. **Daily**
   - Monitor VTPass wallet balance
   - Check for failed transactions
   - Review system logs

2. **Weekly**
   - Database backups verification
   - Performance review
   - User support ticket resolution

3. **Monthly**
   - Security audits
   - Financial reconciliation
   - Feature updates and bug fixes

---

## Conclusion

This money system is currently in **development/testing mode**. To make it production-ready:

1. **Critical**: Integrate real payment gateway (Paystack/Flutterwave)
2. **Critical**: Switch VTPass to production mode
3. **Critical**: Implement proper error handling and logging
4. **Important**: Add cashback automation
5. **Important**: Set up monitoring and alerts
6. **Recommended**: Add comprehensive tests
7. **Recommended**: Implement rate limiting and security headers

**Estimated Timeline**: 2-4 weeks for production readiness with a dedicated developer.

**Contact**: For production deployment assistance, consult with a backend engineer experienced in financial applications and Nigerian payment gateways.
