# Wallet Funding System - Complete Guide

## How the Wallet System Works

Your VTU Bill Payment platform uses a **wallet-based system** where users must first fund their wallet before they can make purchases (buy data, pay electricity bills, etc.).

---

## Complete User Journey

### 1. User Registration
```
User registers → Virtual Account Number automatically generated → Wallet created with ₦0 balance
```

When a user registers, the system automatically:
- Creates a user account
- Generates a unique **Virtual Account Number** (stored in `virtualAccountNumber` field)
- Sets wallet balance to ₦0

### 2. Wallet Funding (How Users Add Money)

**Currently (Testing Mode):**
The system **auto-approves** wallet funding for testing purposes. When a user clicks "Fund Wallet":
- User enters amount
- System immediately credits their wallet
- No actual payment is processed
- ⚠️ **This is NOT production-ready**

**Production Mode (What You Need):**
Users will fund their wallet through a **Payment Gateway** (Paystack, Flutterwave, or Monnify). Here's how it works:

```
Step 1: User clicks "Fund Wallet"
        ↓
Step 2: User enters amount (e.g., ₦5,000)
        ↓
Step 3: System redirects to Payment Gateway
        ↓
Step 4: User pays with:
        - Debit Card
        - Bank Transfer
        - USSD
        - Other payment methods
        ↓
Step 5: Payment Gateway confirms payment
        ↓
Step 6: Your system receives webhook notification
        ↓
Step 7: System credits user's wallet with ₦5,000
        ↓
Step 8: User receives notification
        ↓
Step 9: User can now make purchases
```

---

## Virtual Account Numbers - Explained

### What is a Virtual Account Number?

A **Virtual Account Number** is a unique bank account number assigned to each user. It looks like: `1234567890`

### How It Works (Production Setup with Monnify/Paystack)

**Option 1: Automatic Virtual Accounts (Recommended)**

With services like **Monnify**, each user gets their own dedicated bank account number:

```
User: John Doe
Virtual Account Number: 7012345678
Bank Name: Wema Bank
Account Name: John Doe - YourAppName
```

When John transfers money to this account:
1. Money goes to **your business settlement account**
2. Monnify sends webhook to your backend
3. Your backend automatically credits John's wallet
4. John receives instant notification

**Benefits:**
- ✅ **Instant funding** - No manual approval needed
- ✅ **Automated** - System handles everything
- ✅ **Convenient** - Users can transfer from any bank
- ✅ **Professional** - Looks like a real bank account
- ✅ **Scalable** - Handles thousands of users

**Option 2: Manual Card Payments (Simpler but less convenient)**

Users pay via card through Paystack/Flutterwave:
1. Click "Fund Wallet"
2. Redirected to payment page
3. Enter card details
4. Payment processed
5. Wallet credited automatically

---

## How Money Flows in Your System

### Your Money vs User Money vs VTPass Money

You have **THREE separate wallets** to manage:

#### 1. User Wallets (Individual)
- Each user has their own wallet balance
- Stored in MongoDB: `User.walletBalance`
- Users fund this through payment gateway
- Users spend from this wallet

#### 2. Your VTPass Wallet (Your API Account)
- This is **YOUR wallet** on VTPass
- You fund this manually via VTPass dashboard
- VTPass deducts from this when processing transactions
- You need to monitor and refund this regularly

#### 3. Your Business Bank Account
- This is where user payments land (via payment gateway)
- Your actual business revenue account
- You use this to fund your VTPass wallet

### Complete Money Flow Example

Let's say John wants to buy ₦1,000 worth of data:

```
STEP 1: FUNDING PHASE
John deposits ₦5,000 to his virtual account
       ↓
₦5,000 goes to YOUR business bank account
       ↓
Your system credits John's wallet: ₦5,000
       ↓
Your Profit: ₦0 (money just moved, no transaction yet)

STEP 2: PURCHASE PHASE
John buys ₦1,000 MTN data
       ↓
Your system checks: Does John have ₦1,000? ✓ YES
       ↓
Your system calls VTPass API with ₦1,000 request
       ↓
VTPass deducts from YOUR VTPass wallet
       ↓
VTPass delivers data to John's phone number
       ↓
Your system deducts ₦1,000 from John's wallet
       ↓
Transaction complete!

RESULT:
- John's wallet: ₦5,000 - ₦1,000 = ₦4,000
- Your VTPass wallet: Reduced by ₦1,000
- Your business account: Still has ₦5,000 from John
- Your Profit: ₦0 (you spent ₦1,000 on VTPass to fulfill the order)
```

### How You Make Profit

VTPass charges you different prices than what you charge users. Example:

```
MTN 1GB Data:
- VTPass charges you: ₦250
- You charge John: ₦280
- Your profit: ₦30 per transaction
```

**Money Flow with Profit:**
```
John buys ₦280 of MTN 1GB data
       ↓
Your system deducts ₦280 from John's wallet
       ↓
VTPass deducts ₦250 from your VTPass wallet
       ↓
You keep the difference: ₦30 profit
       ↓
Plus, you still have John's original ₦5,000 deposit in your business account
```

---

## Current Implementation (What Exists Now)

### ✅ What's Working:
1. **User wallet balance tracking** - Each user has a wallet
2. **Virtual account number generation** - Auto-generated on registration
3. **Transaction recording** - All transactions are logged
4. **Admin wallet management** - Admins can credit/debit user wallets
5. **VTPass integration** - API connection is configured
6. **Transaction flow** - Purchase → Check balance → Call VTPass → Debit wallet

### ❌ What's Missing (Production Requirements):
1. **Real payment gateway integration** - Currently auto-approves, needs Paystack/Flutterwave/Monnify
2. **Virtual account activation** - Account numbers exist but aren't linked to real bank accounts
3. **Webhook handling** - No system to receive payment confirmations
4. **Payment verification** - No verification of actual payments
5. **Refund system** - No way to reverse failed transactions

---

## Setting Up Production Wallet Funding

### Option 1: Monnify (Recommended for Virtual Accounts)

**Step 1: Create Monnify Account**
- Sign up at [monnify.com](https://monnify.com)
- Complete business verification
- Get your API keys

**Step 2: Backend Integration**
```javascript
// Install Monnify SDK
npm install monnify-api

// Create virtual account for user
const createVirtualAccount = async (user) => {
  const response = await monnify.createVirtualAccount({
    accountReference: user._id,
    accountName: user.name,
    customerEmail: user.email,
    customerName: user.name,
    getAllAvailableBanks: true
  });
  
  // Save account details
  user.virtualAccountNumber = response.accountNumber;
  user.virtualBankName = response.bankName;
  user.virtualAccountName = response.accountName;
  await user.save();
  
  return response;
};

// Webhook to receive payment notifications
app.post('/api/webhook/monnify', async (req, res) => {
  const { transactionReference, amountPaid, accountReference } = req.body;
  
  // Find user by accountReference (user._id)
  const user = await User.findById(accountReference);
  
  // Credit user wallet
  user.walletBalance += amountPaid;
  await user.save();
  
  // Create transaction record
  await Transaction.create({
    userId: user._id,
    type: 'Wallet Funding',
    transactionType: 'credit',
    amount: amountPaid,
    reference: transactionReference,
    status: 'success'
  });
  
  // Send notification to user
  await sendNotification(user._id, 'Wallet Funded', `Your wallet has been credited with ₦${amountPaid}`);
  
  res.json({ success: true });
});
```

**Step 3: Frontend (Mobile App)**
```javascript
// Display user's virtual account details
const WalletScreen = () => {
  return (
    <View>
      <Text>Fund Your Wallet</Text>
      <Text>Transfer to:</Text>
      <Text>Bank: {user.virtualBankName}</Text>
      <Text>Account Number: {user.virtualAccountNumber}</Text>
      <Text>Account Name: {user.virtualAccountName}</Text>
      <Text>Your wallet will be credited automatically</Text>
    </View>
  );
};
```

**Monthly Cost:** ₦500 - ₦2,000 + 1% per transaction

---

### Option 2: Paystack (For Card Payments)

**Step 1: Create Paystack Account**
- Sign up at [paystack.com](https://paystack.com)
- Get your test and live keys

**Step 2: Backend Integration**
```javascript
// Install Paystack SDK
npm install paystack-api

const paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);

// Initialize payment
app.post('/api/wallet/fund', async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.userId);
  
  const response = await paystack.transaction.initialize({
    email: user.email,
    amount: amount * 100, // Convert to kobo
    callback_url: `${process.env.APP_URL}/api/wallet/verify`,
    metadata: {
      userId: user._id,
      purpose: 'wallet_funding'
    }
  });
  
  res.json({
    success: true,
    payment_url: response.data.authorization_url,
    reference: response.data.reference
  });
});

// Verify payment
app.get('/api/wallet/verify', async (req, res) => {
  const { reference } = req.query;
  
  const response = await paystack.transaction.verify(reference);
  
  if (response.data.status === 'success') {
    const userId = response.data.metadata.userId;
    const amount = response.data.amount / 100; // Convert from kobo
    
    const user = await User.findById(userId);
    user.walletBalance += amount;
    await user.save();
    
    await Transaction.create({
      userId: user._id,
      type: 'Wallet Funding',
      transactionType: 'credit',
      amount,
      reference,
      status: 'success'
    });
    
    res.redirect('/wallet-success');
  } else {
    res.redirect('/wallet-failed');
  }
});
```

**Transaction Fee:** 1.5% + ₦100 per transaction

---

## Frequently Asked Questions

### Q1: Do users get a real bank account number?
**A:** Yes, with **Monnify** integration, each user gets a real account number from banks like Wema Bank, Moniepoint, etc. The account is linked to your business but assigned to the specific user.

### Q2: How will users know their account number?
**A:** It's displayed in the app's "Fund Wallet" or "Profile" screen. Users can copy it and transfer from their bank app.

### Q3: Is the wallet funding instant?
**A:** 
- **Monnify Virtual Accounts:** Near instant (30 seconds - 2 minutes)
- **Paystack Card Payment:** Instant
- **Bank Transfer via Paystack:** 10-30 minutes

### Q4: What if a user pays but wallet isn't credited?
**A:** 
1. Payment gateway sends webhook to your backend
2. If webhook fails, you can manually verify using the transaction reference
3. Admin can also manually credit the wallet from admin dashboard

### Q5: How do I fund MY VTPass wallet?
**A:**
1. Log in to [VTPass Dashboard](https://vtpass.com)
2. Go to "Wallet" section
3. Click "Fund Wallet"
4. Pay via card/bank transfer
5. Your VTPass wallet is credited
6. You can now process user transactions

### Q6: How much should I keep in my VTPass wallet?
**A:** 
- Calculate your daily average transactions
- Keep at least 3-5 days worth of transactions
- Example: If you process ₦100,000/day, keep ₦300,000-₦500,000 in VTPass wallet
- Set up alerts when balance is low

### Q7: What happens if my VTPass wallet is empty?
**A:**
- User transactions will fail
- VTPass will return an error: "Insufficient balance"
- Your system should handle this gracefully and notify you
- User's wallet won't be debited if VTPass fails

---

## Recommended Setup Timeline

**Week 1: Testing & Integration**
- Set up Paystack/Monnify test account
- Integrate payment gateway (development mode)
- Test wallet funding flow
- Test transaction flow with VTPass sandbox

**Week 2: Admin Features**
- Set up admin dashboard monitoring
- Configure VTPass wallet alerts
- Test refund/reversal mechanisms
- Train staff on admin operations

**Week 3: Go Live Preparation**
- Switch to production keys
- Fund VTPass wallet with initial capital
- Test with small real transactions
- Set up monitoring and alerts

**Week 4: Launch**
- Go live with real users
- Monitor closely for issues
- Have support team ready
- Keep VTPass wallet well-funded

---

## Cost Summary

### One-Time Costs:
- **Monnify Setup:** Free - ₦50,000 (depending on tier)
- **Paystack Setup:** Free
- **Business Registration:** ₦10,000 - ₦150,000

### Monthly Recurring Costs:
- **Monnify Fee:** ₦500 - ₦2,000 + 1% per transaction
- **Paystack Fee:** 1.5% + ₦100 per transaction
- **VTPass:** No monthly fee, only transaction fees
- **Server Hosting:** Already covered by Koyeb
- **SMS Notifications (optional):** ₦2-5 per SMS

### Example Revenue Calculation:
```
100 users fund ₦5,000 each = ₦500,000 in your business account
Users make purchases worth ₦300,000
Your VTPass cost: ₦270,000
Your profit margin: ₦30,000
Minus payment gateway fees (₦5,000)
Net profit: ₦25,000
```

---

## Next Steps

1. **Choose Payment Gateway:**
   - Monnify (for virtual accounts)
   - Paystack (for card payments)
   - Or both for maximum flexibility

2. **Get API Keys:**
   - Test keys first
   - Live keys after testing

3. **Integrate Backend:**
   - Follow integration guides above
   - Test thoroughly

4. **Update Mobile App:**
   - Show virtual account details
   - Redirect to payment gateway for card payments
   - Handle payment confirmations

5. **Train Admin Team:**
   - How to monitor wallets
   - How to handle failed transactions
   - How to fund VTPass wallet

6. **Go Live:**
   - Start small
   - Monitor closely
   - Scale gradually

---

## Support & Resources

- **Monnify Documentation:** [docs.monnify.com](https://docs.monnify.com)
- **Paystack Documentation:** [paystack.com/docs](https://paystack.com/docs)
- **VTPass Documentation:** [vtpass.com/documentation](https://vtpass.com/documentation)

---

## Current Status in Replit

✅ **What's Ready:**
- Backend wallet management
- VTPass integration (sandbox)
- Transaction recording
- Admin wallet controls

❌ **What Needs Integration:**
- Real payment gateway (Paystack/Monnify)
- Production VTPass credentials
- Webhook handling
- Virtual account activation

**Your system is 80% ready. The final 20% is payment gateway integration, which can be done in 1-2 weeks.**
